import { z } from "zod";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { businessModel } from "@/lib/business";
import { platformAdminModel, requireSuperAdmin } from "@/lib/super-admin";
import { handleError, ok, fail } from "@/lib/api";
import User from "@/models/User";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";
const planNames = SUBSCRIPTION_PLANS.map((plan) => plan.plan) as [string, ...string[]];
const schema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().regex(/^[a-z][a-z0-9-]{1,48}$/),
  host: z.string().trim().toLowerCase().regex(/^[a-z0-9.-]+(?::[0-9]+)?$/),
  siteUrl: z.url().refine(v => ["http:", "https:"].includes(new URL(v).protocol)),
  logoUrl: z.union([z.literal(""), z.url().refine(v => new URL(v).protocol === "https:")]).default(""),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#0060e6"),
  adminName: z.string().trim().min(2), adminEmail: z.email().toLowerCase(), adminPassword: z.string().min(12).max(128),
  plan: z.enum(planNames).default("basic"), monthlyAmount: z.coerce.number().nonnegative().optional(), setupFee: z.coerce.number().nonnegative().optional(), setupPaidAmount: z.coerce.number().nonnegative().optional(),
});
export async function GET() {
  try {
    await requireSuperAdmin();
    const model = await businessModel();
    const businesses = await model.find().sort({ createdAt: -1 }).lean();
    const data = await Promise.all(businesses.map(async (business) => {
      const db = mongoose.connection.useDb(business.databaseName, { useCache: true });
      const users = db.models.User || db.model("User", User.schema);
      const owner = await users.findOne({ role: "tenant", businessId: business._id }).select("name email").lean();
      const { databaseName: _databaseName, ...safeBusiness } = business;
      return { ...safeBusiness, owner: owner ? { name: owner.name, email: owner.email } : undefined };
    }));
    return ok(data);
  }
  catch (e) { return handleError(e); }
}
export async function POST(request: Request) {
  try {
    await requireSuperAdmin();
    const input = schema.parse(await request.json());
    const model = await businessModel();
    if (await model.exists({ $or: [{ slug: input.slug }, { hosts: input.host }] })) return fail("Business slug or portal host already exists", 409);
    // Reserve a suspended business first. Failed provisioning never exposes a partial agency.
    const selectedPlan = SUBSCRIPTION_PLANS.find((plan) => plan.plan === input.plan)!;
    const setupFee = input.setupFee ?? selectedPlan.setupFee;
    const setupPaidAmount = Math.min(input.setupPaidAmount ?? 0, setupFee);
    const business = await model.create({ name: input.name, slug: input.slug, databaseName: `agency_${new mongoose.Types.ObjectId()}`, hosts: [input.host], siteUrl: input.siteUrl, logoUrl: input.logoUrl, primaryColor: input.primaryColor, status: "suspended", subscription: { plan: selectedPlan.plan, status: "trial", amount: input.monthlyAmount ?? selectedPlan.price, setupFee, setupPaidAmount, setupPaidAt: setupPaidAmount ? new Date() : null, currency: "INR", renewsAt: null } });
    const db = mongoose.connection.useDb(business.databaseName, { useCache: true });
    const users = db.model("User", User.schema);
    await users.init();
    await users.create({ name: input.adminName, email: input.adminEmail, password: await bcrypt.hash(input.adminPassword, 12), role: "tenant", businessId: business._id });
    business.provisioned = true;
    business.status = "active";
    await business.save();
    return ok({ id: String(business._id), slug: business.slug }, 201);
  } catch (e) { return handleError(e); }
}
export async function PATCH(request: Request) {
  try {
    const platformAdmin = await requireSuperAdmin();
    const input = z.object({
      id: z.string().regex(/^[a-f\d]{24}$/i),
      name: z.string().trim().min(2).max(100).optional(),
      slug: z.string().regex(/^[a-z][a-z0-9-]{1,48}$/).optional(),
      host: z.string().trim().toLowerCase().regex(/^[a-z0-9.-]+(?::[0-9]+)?$/).optional(),
      siteUrl: z.url().optional(),
      adminName: z.string().trim().min(2).optional(),
      adminEmail: z.email().toLowerCase().optional(),
      primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      status: z.enum(["active", "suspended"]).optional(),
      adminPassword: z.string().min(1).optional(),
      tenantNewPassword: z.string().min(12).max(128).optional(),
      subscription: z.object({
        plan: z.enum(planNames),
        amount: z.coerce.number().nonnegative().optional(),
        setupFee: z.coerce.number().nonnegative().optional(),
        setupPaidAmount: z.coerce.number().nonnegative().optional(),
      }).optional(),
    }).superRefine((value, ctx) => {
      if (!value.name && !value.slug && !value.host && !value.siteUrl && !value.adminName && !value.adminEmail && !value.primaryColor && !value.status && !value.subscription && !value.tenantNewPassword) ctx.addIssue({ code: "custom", message: "Add at least one update" });
      if (Boolean(value.adminPassword) !== Boolean(value.tenantNewPassword)) ctx.addIssue({ code: "custom", message: "Enter both passwords to reset tenant access" });
    }).parse(await request.json());
    const model = await businessModel();
    const businessRecord = await model.findOne({ _id: input.id, provisioned: true });
    if (!businessRecord) return fail("Tenant not found", 404);

    if (input.slug || input.host) {
      const conflict = await model.exists({ _id: { $ne: businessRecord._id }, $or: [
        ...(input.slug ? [{ slug: input.slug }] : []),
        ...(input.host ? [{ hosts: input.host }] : []),
      ] });
      if (conflict) return fail("Business slug or portal host already exists", 409);
    }

    const db = mongoose.connection.useDb(businessRecord.databaseName, { useCache: true });
    const users = db.models.User || db.model("User", User.schema);
    const ownerUpdates: Record<string, string> = {};
    if (input.adminName) ownerUpdates.name = input.adminName;
    if (input.adminEmail) ownerUpdates.email = input.adminEmail;

    if (input.tenantNewPassword) {
      const admins = await platformAdminModel();
      const account = await admins.findOne({ email: platformAdmin.email }).select("+password");
      if (!account?.password || !await bcrypt.compare(input.adminPassword!, account.password)) return fail("Your admin password is incorrect", 422);
      ownerUpdates.password = await bcrypt.hash(input.tenantNewPassword, 12);
    }
    if (Object.keys(ownerUpdates).length) {
      const owner = await users.findOneAndUpdate(
        { role: "tenant", businessId: businessRecord._id },
        { $set: ownerUpdates },
        { new: true },
      );
      if (!owner) return fail("Tenant owner account was not found", 404);
    }
    const update: Record<string, unknown> = {};
    if (input.name) update.name = input.name;
    if (input.slug) update.slug = input.slug;
    if (input.host) update.hosts = [input.host];
    if (input.siteUrl) update.siteUrl = input.siteUrl;
    if (input.primaryColor) update.primaryColor = input.primaryColor;
    if (input.status) update.status = input.status;
    if (input.subscription) {
      const subscription = input.subscription;
      const current = businessRecord.subscription ?? { status: "trial", currency: "INR", renewsAt: null, setupPaidAmount: 0, amount: 0 };
      const selectedPlan = SUBSCRIPTION_PLANS.find((plan) => plan.plan === subscription.plan)!;
      const setupFee = subscription.setupFee ?? businessRecord.subscription?.setupFee ?? 0;
      update.subscription = {
        ...current,
        ...subscription,
        amount: subscription.amount ?? (subscription.plan === current.plan ? current.amount : selectedPlan.price),
        setupFee,
        setupPaidAmount: Math.min(subscription.setupPaidAmount ?? businessRecord.subscription?.setupPaidAmount ?? 0, setupFee),
      };
    }
    const business = Object.keys(update).length
      ? await model.findOneAndUpdate({ _id: input.id, provisioned: true }, update, { new: true }).select("-databaseName").lean()
      : await model.findById(input.id).select("-databaseName").lean();
    return business ? ok(business) : fail("Tenant not found", 404);
  } catch (e) { return handleError(e); }
}

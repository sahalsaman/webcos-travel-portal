import { z } from "zod";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { businessModel } from "@/lib/business";
import { requireSuperAdmin } from "@/lib/super-admin";
import { handleError, ok, fail } from "@/lib/api";
import User from "@/models/User";
const schema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().regex(/^[a-z][a-z0-9-]{1,48}$/),
  host: z.string().trim().toLowerCase().regex(/^[a-z0-9.-]+(?::[0-9]+)?$/),
  siteUrl: z.url().refine(v => ["http:", "https:"].includes(new URL(v).protocol)),
  logoUrl: z.union([z.literal(""), z.url().refine(v => new URL(v).protocol === "https:")]).default(""),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#0060e6"),
  adminName: z.string().trim().min(2), adminEmail: z.email().toLowerCase(), adminPassword: z.string().min(12).max(128),
});
export async function GET() {
  try { await requireSuperAdmin(); const model = await businessModel(); return ok(await model.find().select("-databaseName").sort({ createdAt: -1 }).lean()); }
  catch (e) { return handleError(e); }
}
export async function POST(request: Request) {
  try {
    await requireSuperAdmin();
    const input = schema.parse(await request.json());
    const model = await businessModel();
    if (await model.exists({ $or: [{ slug: input.slug }, { hosts: input.host }] })) return fail("Business slug or portal host already exists", 409);
    // Reserve a suspended business first. Failed provisioning never exposes a partial agency.
    const business = await model.create({ name: input.name, slug: input.slug, databaseName: `agency_${new mongoose.Types.ObjectId()}`, hosts: [input.host], siteUrl: input.siteUrl, logoUrl: input.logoUrl, primaryColor: input.primaryColor, status: "suspended" });
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
    await requireSuperAdmin();
    const input = z.object({
      id: z.string().regex(/^[a-f\d]{24}$/i),
      name: z.string().trim().min(2).max(100).optional(),
      siteUrl: z.url().optional(),
      status: z.enum(["active", "suspended"]).optional(),
      subscription: z.object({
        plan: z.string().trim().min(2).max(60),
        status: z.enum(["trial", "active", "past_due", "cancelled"]),
        amount: z.coerce.number().nonnegative(),
        currency: z.string().trim().length(3).default("INR"),
        renewsAt: z.string().datetime().nullable().optional(),
      }).optional(),
    }).refine((value) => value.name || value.siteUrl || value.status || value.subscription, "Add at least one update").parse(await request.json());
    const model = await businessModel();
    const update: Record<string, unknown> = {};
    if (input.name) update.name = input.name;
    if (input.siteUrl) update.siteUrl = input.siteUrl;
    if (input.status) update.status = input.status;
    if (input.subscription) update.subscription = { ...input.subscription, renewsAt: input.subscription.renewsAt ? new Date(input.subscription.renewsAt) : null };
    const business = await model.findOneAndUpdate({ _id: input.id, provisioned: true }, update, { new: true }).select("-databaseName").lean();
    return business ? ok(business) : fail("Tenant not found", 404);
  } catch (e) { return handleError(e); }
}

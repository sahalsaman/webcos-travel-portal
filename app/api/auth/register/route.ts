import { tenantModel } from "@/lib/tenant-db";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { ok, fail, handleError } from "@/lib/api";
import { travelerRegisterSchema } from "@/lib/validations";
import User from "@/models/User";
import { notifyAdminsAndEmployees } from "@/lib/notifications";
import { getBusiness } from "@/lib/business";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body?.role === "partner" || body?.role === "vendor_partner") {
      return fail("Partner accounts are invite-only. Please contact admin.", 403);
    }

    const data = travelerRegisterSchema.parse(body);
    const business = await getBusiness();
    await connectDB();
    const passwordHash = await bcrypt.hash(data.password, 10);
    const existing = await (await tenantModel(User)).findOne({ email: data.email }).select("+password role");
    if (existing?.password || (existing && existing.role !== "vendor_traveler" && existing.role !== "traveler")) {
      return fail("An account with this email already exists", 409);
    }
    const user = existing
      ? await (await tenantModel(User)).findByIdAndUpdate(existing._id, { $set: { name: data.name, mobile: data.mobile, password: passwordHash } }, { returnDocument: "after" })
      : await (await tenantModel(User)).create({ name: data.name, email: data.email, mobile: data.mobile, password: passwordHash, role: "vendor_traveler", businessId: business._id });
    await notifyAdminsAndEmployees({
      type: "registration",
      title: "New traveler registered",
      message: `${data.name} created a traveler account.`,
      meta: { userId: String(user?._id), href: "/admin/users/customers" },
    }, "users");
    return ok({ id: String(user._id), role: "vendor_traveler" }, 201);
  } catch (err) {
    return handleError(err);
  }
}

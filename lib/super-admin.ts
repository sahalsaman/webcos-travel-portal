import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { configuredPlatformDatabase, connectDB } from "@/lib/db";
export async function platformAdminModel() {
  await connectDB();
  const db = mongoose.connection.useDb(configuredPlatformDatabase(), { useCache: true });
  return db.models.PlatformAdmin || db.model("PlatformAdmin", new Schema({
    email: { type: String, required: true, unique: true }, name: String, password: { type: String, required: true },
  }, { timestamps: true }));
}
export async function authorizeSuperAdmin(email: string, password: string) {
  const model = await platformAdminModel();
  const user = await model.findOne({ email: email.toLowerCase() }).lean();
  if (!user || !await bcrypt.compare(password, user.password)) return null;
  // Platform administrators use the public `admin` role. They have no tenant
  // businessId, which is how the session layer distinguishes them from an
  // agency owner (`vendor`).
  return { id: String(user._id), name: user.name as string, email: user.email as string, role: "admin", businessId: undefined };
}
export async function requireSuperAdmin() {
  const { auth } = await import("@/auth");
  const session = await auth();
  if (session?.user?.role !== "admin" || session.user.businessId) throw new Response("Forbidden", { status: 403 });
  return session.user;
}

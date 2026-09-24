import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import Employee from "@/models/Employee";

export async function getHrmAccess() {
  const user = await getCurrentUser();
  if (!user) return { user: null, employeeId: undefined, canManage: false };
  if (user.role === "admin") return { user, employeeId: undefined, canManage: true };
  if (user.role !== "vendor_employee") return { user, employeeId: undefined, canManage: false };
  await connectDB();
  const employee = await (await tenantModel(Employee)).findOne({ user: user.id, status: "active", portalAccess: true }).select("_id hrAccess").lean<{ _id: unknown; hrAccess?: "self" | "manage" }>();
  return { user, employeeId: employee ? String(employee._id) : undefined, canManage: employee?.hrAccess === "manage" };
}

import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import type { TenantPortalPageKey, NotificationType } from "@/lib/constants";
import "@/models";
import Employee from "@/models/Employee";
import Notification from "@/models/Notification";
import User from "@/models/User";
import { getBusiness } from "@/lib/business";

interface NotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  meta?: Record<string, unknown>;
}

async function createForUsers(userIds: unknown[], input: NotificationInput) {
  const uniqueIds = [...new Set(userIds.filter(Boolean).map(String))];
  if (!uniqueIds.length) return;
  const business = await getBusiness();
  await (await tenantModel(Notification)).insertMany(uniqueIds.map((user) => ({ businessId: business._id, user, channel: "in-app", ...input })));
}

export async function notifyAdminsAndEmployees(input: NotificationInput, employeePage?: TenantPortalPageKey) {
  try {
    await connectDB();
    const [admins, employees] = await Promise.all([
      // `tenant` is the agency owner role. Keep legacy `admin` support for
      // older tenant databases during the role-name migration.
      (await tenantModel(User)).find({ role: { $in: ["tenant", "admin"] } }).select("_id").lean(),
      (await tenantModel(Employee)).find({ status: "active", portalAccess: true, user: { $ne: null }, ...(employeePage ? { portalPages: employeePage } : {}) }).select("user").lean(),
    ]);
    await createForUsers([...admins.map((admin) => admin._id), ...employees.map((employee) => employee.user)], input);
  } catch (error) {
    console.error("[notifications] staff notification failed:", (error as Error).message);
  }
}

export async function notifyEmployee(employeeId: string, input: NotificationInput) {
  try {
    await connectDB();
    const employee = await (await tenantModel(Employee)).findById(employeeId).select("user").lean();
    if (employee?.user) await createForUsers([employee.user], input);
  } catch (error) {
    console.error("[notifications] employee notification failed:", (error as Error).message);
  }
}

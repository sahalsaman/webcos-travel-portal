import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { calculateWorkHours } from "@/lib/attendance";
import { currentUser, fail, handleError, ok } from "@/lib/api";
import { attendanceRegularizationSchema } from "@/lib/validations";
import "@/models";
import Attendance from "@/models/Attendance";
import AttendanceRegularization from "@/models/AttendanceRegularization";
import Employee from "@/models/Employee";

function todayInIndia() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

async function attendanceIdentity() {
  const user = await currentUser();
  if (!user || !["admin", "employee"].includes(user.role)) return null;
  await connectDB();
  if (user.role === "admin") return { user, employee: null, canManage: true };
  const employee = await (await tenantModel(Employee)).findOne({ user: user.id, status: "active", portalAccess: true }).select("_id hrAccess").lean<{ _id: unknown; hrAccess?: "self" | "manage" }>();
  if (!employee) return null;
  return { user, employee, canManage: employee.hrAccess === "manage" };
}

export async function POST(request: Request) {
  try {
    const identity = await attendanceIdentity();
    if (!identity?.employee) return fail("An active employee profile is required", 403);
    const data = attendanceRegularizationSchema.parse(await request.json());
    if (data.date > todayInIndia()) return fail("Future attendance cannot be regularized", 422);
    const date = new Date(`${data.date}T00:00:00.000Z`);
    const attendance = await (await tenantModel(Attendance)).findOne({ employee: identity.employee._id, date }).select("checkIn").lean<{ checkIn?: string }>();
    if (attendance?.checkIn) return fail("Attendance is already recorded for this date", 409);

    const record = await (await tenantModel(AttendanceRegularization)).findOneAndUpdate(
      { employee: identity.employee._id, date },
      { ...data, employee: identity.employee._id, date, status: "pending", reviewNotes: "", reviewedBy: null },
      { upsert: true, new: true, runValidators: true },
    );
    return ok(record, 201);
  } catch (error) { return handleError(error); }
}

export async function PATCH(request: Request) {
  try {
    const identity = await attendanceIdentity();
    if (!identity?.canManage) return fail("Only HR or an administrator can review requests", 403);
    const body = await request.json() as { id?: string; status?: "approved" | "rejected"; reviewNotes?: string };
    if (!body.id || !["approved", "rejected"].includes(body.status ?? "")) return fail("Invalid review action", 400);
    const regularization = await (await tenantModel(AttendanceRegularization)).findById(body.id);
    if (!regularization) return fail("Regularization request not found", 404);
    if (regularization.status !== "pending") return fail("This request has already been reviewed", 409);

    if (body.status === "approved") {
      const existing = await (await tenantModel(Attendance)).findOne({ employee: regularization.employee, date: regularization.date }).select("checkIn").lean<{ checkIn?: string }>();
      if (existing?.checkIn) return fail("Attendance has already been recorded for this date", 409);
      await (await tenantModel(Attendance)).findOneAndUpdate(
        { employee: regularization.employee, date: regularization.date },
        { employee: regularization.employee, date: regularization.date, status: "present", checkIn: regularization.requestedCheckIn, checkOut: regularization.requestedCheckOut, workHours: calculateWorkHours(regularization.requestedCheckIn, regularization.requestedCheckOut), notes: `Regularized: ${regularization.reason}` },
        { upsert: true, new: true, runValidators: true },
      );
    }
    regularization.status = body.status!;
    regularization.reviewNotes = body.reviewNotes?.trim() ?? "";
    regularization.reviewedBy = identity.user.id as never;
    await regularization.save();
    return ok(regularization);
  } catch (error) { return handleError(error); }
}

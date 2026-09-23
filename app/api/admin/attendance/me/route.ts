import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { currentUser, fail, handleError, ok } from "@/lib/api";
import "@/models";
import Attendance from "@/models/Attendance";
import Employee from "@/models/Employee";
import { calculateWorkHours } from "@/lib/attendance";

function indiaNow() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return { date: `${value.year}-${value.month}-${value.day}`, time: `${value.hour}:${value.minute}` };
}

async function currentEmployee() {
  const user = await currentUser();
  if (!user || !["admin", "employee"].includes(user.role)) return null;
  await connectDB();
  return (await tenantModel(Employee)).findOne({ user: user.id, status: "active", portalAccess: true }).select("_id name").lean();
}

export async function GET() {
  try {
    const employee = await currentEmployee();
    if (!employee) return ok({ available: false, record: null });
    const { date } = indiaNow();
    const record = await (await tenantModel(Attendance)).findOne({ employee: employee._id, date: new Date(`${date}T00:00:00.000Z`) }).lean();
    return ok({ available: true, employeeName: employee.name, record });
  } catch (error) { return handleError(error); }
}

export async function POST(request: Request) {
  try {
    const employee = await currentEmployee();
    if (!employee) return fail("An active employee profile is required", 403);
    const { action } = (await request.json()) as { action?: "check-in" | "check-out" };
    if (action !== "check-in" && action !== "check-out") return fail("Invalid attendance action", 400);
    const { date, time } = indiaNow();
    const attendanceDate = new Date(`${date}T00:00:00.000Z`);
    if (action === "check-in") {
      const existing = await (await tenantModel(Attendance)).findOne({ employee: employee._id, date: attendanceDate });
      if (existing?.checkIn) return ok(existing);
      const record = existing ?? new Attendance({ employee: employee._id, date: attendanceDate, status: "present" });
      record.checkIn = time;
      record.status = "present";
      await record.save();
      return ok(record.toObject());
    }
    const record = await (await tenantModel(Attendance)).findOne({ employee: employee._id, date: attendanceDate });
    if (!record?.checkIn) return fail("Check in before checking out", 409);
    if (!record.checkOut) {
      record.checkOut = time;
      record.workHours = calculateWorkHours(record.checkIn, time);
      await record.save();
    }
    return ok(record.toObject());
  } catch (error) { return handleError(error); }
}

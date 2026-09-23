import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { handleError, ok, requireApiRole } from "@/lib/api";
import { calculateWorkHours } from "@/lib/attendance";
import { attendanceSchema } from "@/lib/validations";
import Attendance from "@/models/Attendance";

export async function POST(request: Request) {
  try {
    await requireApiRole(["admin"]);
    const data = attendanceSchema.parse(await request.json());
    await connectDB();
    const record = await (await tenantModel(Attendance)).create({
      ...data,
      employee: data.employeeId,
      date: new Date(data.date),
      workHours: calculateWorkHours(data.checkIn, data.checkOut),
    });
    return ok({ id: String(record._id) }, 201);
  } catch (error) {
    return handleError(error);
  }
}

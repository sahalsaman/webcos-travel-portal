import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { fail, handleError, ok, requireApiRole } from "@/lib/api";
import { calculateWorkHours } from "@/lib/attendance";
import { attendanceSchema } from "@/lib/validations";
import Attendance from "@/models/Attendance";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  try {
    await requireApiRole(["admin"]);
    const { id } = await params;
    const data = attendanceSchema.parse(await request.json());
    await connectDB();
    const record = await (await tenantModel(Attendance)).findByIdAndUpdate(
      id,
      {
        ...data,
        employee: data.employeeId,
        date: new Date(data.date),
        workHours: calculateWorkHours(data.checkIn, data.checkOut),
      },
      { new: true, runValidators: true },
    );
    return record ? ok(record) : fail("Not found", 404);
  } catch (error) {
    return handleError(error);
  }
}

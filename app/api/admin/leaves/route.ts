import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";
import { getHrmAccess } from "@/lib/hr-access";
import { notifyEmployee } from "@/lib/notifications";
import { leaveRequestSchema } from "@/lib/validations";
import LeaveRequest from "@/models/LeaveRequest";

export async function POST(request: Request) {
  try {
    const access = await getHrmAccess();
    if (!access.user || !["admin", "employee"].includes(access.user.role)) return fail("Forbidden", 403);
    const body = await request.json() as Record<string, unknown>;
    if (!access.canManage) {
      if (!access.employeeId) return fail("An active employee profile is required", 403);
      body.employeeId = access.employeeId;
      body.status = "pending";
      body.adminNotes = "";
    }
    const data = leaveRequestSchema.parse(body);
    await connectDB();
    const record = await (await tenantModel(LeaveRequest)).create({ ...data, employee: data.employeeId, startDate: new Date(data.startDate), endDate: new Date(data.endDate) });
    await notifyEmployee(data.employeeId, { type:"system", title:"Leave request recorded", message:`Your ${data.type} leave request for ${data.days} day(s) is ${data.status}.`, meta:{ leaveId:String(record._id), href:"/admin/hrm/leaves" } });
    return ok({ id:String(record._id) }, 201);
  } catch (error) { return handleError(error); }
}

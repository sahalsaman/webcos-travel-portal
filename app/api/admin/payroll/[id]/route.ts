import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { fail, handleError, ok, requireApiRole } from "@/lib/api";
import { payrollSchema } from "@/lib/validations";
import "@/models";
import Employee from "@/models/Employee";
import Payroll from "@/models/Payroll";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    await requireApiRole(["admin"]);
    const { id } = await params;
    const data = payrollSchema.parse(await request.json());
    await connectDB();
    const current = await (await tenantModel(Payroll)).findById(id);
    if (!current) return fail("Payroll record not found", 404);
    const employee = await (await tenantModel(Employee)).findById(data.employeeId);
    if (!employee) return fail("Employee not found", 404);
    const duplicate = await (await tenantModel(Payroll)).findOne({ employee: employee._id, month: data.month, _id: { $ne: current._id } });
    if (duplicate) return fail("Payroll already exists for this employee and month", 409);
    current.employee = employee._id;
    current.month = data.month;
    current.basicSalary = data.basicSalary;
    current.allowances = data.allowances;
    current.deductions = data.deductions;
    current.netPay = Math.max(0, data.basicSalary + data.allowances - data.deductions);
    current.status = data.status;
    current.paymentDate = data.paymentDate ? new Date(data.paymentDate) : null;
    current.paymentReference = data.paymentReference;
    current.notes = data.notes;
    await current.save();
    return ok({ id: String(current._id) });
  } catch (err) {
    return handleError(err);
  }
}

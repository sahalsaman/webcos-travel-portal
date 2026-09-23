import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { fail, handleError, ok, requireApiRole } from "@/lib/api";
import { payrollSchema } from "@/lib/validations";
import "@/models";
import Employee from "@/models/Employee";
import Payroll from "@/models/Payroll";
import { notifyEmployee } from "@/lib/notifications";

export async function GET() {
  try {
    await requireApiRole(["admin"]);
    await connectDB();
    const payroll = await (await tenantModel(Payroll)).find({})
      .sort({ month: -1, createdAt: -1 })
      .populate("employee", "name email designation department")
      .lean();
    return ok(payroll);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireApiRole(["admin"]);
    const data = payrollSchema.parse(await request.json());
    await connectDB();
    const employee = await (await tenantModel(Employee)).findById(data.employeeId);
    if (!employee) return fail("Employee not found", 404);
    const existing = await (await tenantModel(Payroll)).findOne({ employee: employee._id, month: data.month });
    if (existing) return fail("Payroll already exists for this employee and month", 409);
    const netPay = Math.max(0, data.basicSalary + data.allowances - data.deductions);
    const payroll = await (await tenantModel(Payroll)).create({
      employee: employee._id,
      month: data.month,
      basicSalary: data.basicSalary,
      allowances: data.allowances,
      deductions: data.deductions,
      netPay,
      status: data.status,
      paymentDate: data.paymentDate || null,
      paymentReference: data.paymentReference,
      notes: data.notes,
    });
    await notifyEmployee(data.employeeId, {
      type: "payout",
      title: "Payroll generated",
      message: `Payroll for ${data.month} has been generated with net pay ₹${netPay.toLocaleString("en-IN")}.`,
      meta: { payrollId: String(payroll._id), href: "/admin/hrm/payroll" },
    });
    return ok({ id: String(payroll._id) }, 201);
  } catch (err) {
    return handleError(err);
  }
}

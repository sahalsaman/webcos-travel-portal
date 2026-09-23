import { WalletCards } from "lucide-react";
import { PayrollDrawer } from "@/components/admin/payroll-drawer";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatINR } from "@/lib/utils";
import type { EmployeeDTO, PayrollDTO } from "@/types";

function employeeDetails(payroll: PayrollDTO) {
  return typeof payroll.employee === "string" ? null : payroll.employee;
}

function monthLabel(month: string) {
  const [year, value] = month.split("-").map(Number);
  return new Date(year, value - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export function PayrollSection({ payroll, employees, canManage = true, filters }: { payroll: PayrollDTO[]; employees: EmployeeDTO[]; canManage?: boolean; filters?: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Employee Payroll</h2>
          <p className="text-muted-foreground">{payroll.length} payroll records</p>
        </div>
        {canManage && <PayrollDrawer employees={employees} />}
      </div>
      {filters}
      {payroll.length ? (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="p-4 font-medium">Employee</th>
                  <th className="p-4 font-medium">Month</th>
                  <th className="p-4 font-medium">Salary</th>
                  <th className="p-4 font-medium">Allowances</th>
                  <th className="p-4 font-medium">Deductions</th>
                  <th className="p-4 font-medium">Net pay</th>
                  <th className="p-4 font-medium">Payment</th>
                  <th className="p-4 font-medium">Status</th>
                  {canManage && <th className="p-4 text-right font-medium">Action</th>}
                </tr>
              </thead>
              <tbody>
                {payroll.map((item) => {
                  const employee = employeeDetails(item);
                  return (
                    <tr key={item._id} className="border-b border-border/50 hover:bg-secondary/40">
                      <td className="p-4"><p className="font-medium">{employee?.name ?? "Unknown employee"}</p><p className="text-xs text-muted-foreground">{employee?.designation ?? "—"}</p></td>
                      <td className="p-4">{monthLabel(item.month)}</td>
                      <td className="p-4">{formatINR(item.basicSalary)}</td>
                      <td className="p-4">{formatINR(item.allowances)}</td>
                      <td className="p-4">{formatINR(item.deductions)}</td>
                      <td className="p-4 font-bold">{formatINR(item.netPay)}</td>
                      <td className="p-4 text-muted-foreground"><p>{item.paymentDate ? formatDate(item.paymentDate) : "Not paid"}</p><p className="text-xs">{item.paymentReference || "—"}</p></td>
                      <td className="p-4"><StatusBadge status={item.status} /></td>
                      {canManage && <td className="p-4 text-right"><PayrollDrawer payroll={item} employees={employees} /></td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : (
        <EmptyState icon={WalletCards} title="No payroll records" description={canManage ? "Create monthly payroll records for employees." : "Your payroll records will appear here."} action={canManage ? <PayrollDrawer employees={employees} /> : undefined} />
      )}
    </div>
  );
}

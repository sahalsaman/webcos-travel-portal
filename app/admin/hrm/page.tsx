import Link from "next/link";
import { BadgeIndianRupee, KeyRound, UserCheck, UsersRound } from "lucide-react";
import { AttendanceClockCard } from "@/components/admin/attendance-clock-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listAdminEmployees, listAdminPayroll } from "@/lib/dashboard";
import { formatINR } from "@/lib/utils";
import type { EmployeeDTO, PayrollDTO } from "@/types";

export default async function HrmDashboardPage() {
  const [employees, payroll] = await Promise.all([listAdminEmployees() as Promise<EmployeeDTO[]>, listAdminPayroll() as Promise<PayrollDTO[]>]);
  const active = employees.filter((employee) => employee.status === "active").length;
  const portal = employees.filter((employee) => employee.portalAccess).length;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthPayroll = payroll.filter((item) => item.month === currentMonth);
  const payrollTotal = monthPayroll.reduce((sum, item) => sum + item.netPay, 0);

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold">HRM Dashboard</h1><p className="text-muted-foreground">Team, access and payroll overview</p></div>
    <AttendanceClockCard />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Total Employees" value={employees.length} icon={UsersRound}/><StatCard label="Active Employees" value={active} icon={UserCheck} accent="success"/><StatCard label="Portal Access" value={portal} icon={KeyRound} accent="accent"/><StatCard label="Current Payroll" value={formatINR(payrollTotal)} icon={BadgeIndianRupee} accent="warning" hint={`${monthPayroll.length} records`}/></div>
    <div className="grid gap-5 xl:grid-cols-2">
      <Card><CardHeader className="flex-row items-center justify-between"><CardTitle>Recent employees</CardTitle><Button asChild variant="ghost" size="sm"><Link href="/admin/hrm/employees">Manage</Link></Button></CardHeader><CardContent className="space-y-2">{employees.slice(0,5).map((employee)=><div key={employee._id} className="flex items-center justify-between rounded-lg border p-3 text-sm"><div><p className="font-medium">{employee.name}</p><p className="text-xs text-muted-foreground">{employee.designation} · {employee.department}</p></div><StatusBadge status={employee.status}/></div>)}{!employees.length?<p className="text-sm text-muted-foreground">No employees added.</p>:null}</CardContent></Card>
      <Card><CardHeader className="flex-row items-center justify-between"><CardTitle>Recent payroll</CardTitle><Button asChild variant="ghost" size="sm"><Link href="/admin/hrm/payroll">Manage</Link></Button></CardHeader><CardContent className="space-y-2">{payroll.slice(0,5).map((item)=>{const employee=typeof item.employee==="string"?null:item.employee;return <div key={item._id} className="flex items-center justify-between rounded-lg border p-3 text-sm"><div><p className="font-medium">{employee?.name||"Employee"}</p><p className="text-xs text-muted-foreground">{item.month}</p></div><div className="text-right"><p className="font-semibold">{formatINR(item.netPay)}</p><StatusBadge status={item.status}/></div></div>})}{!payroll.length?<p className="text-sm text-muted-foreground">No payroll records.</p>:null}</CardContent></Card>
    </div>
  </div>;
}

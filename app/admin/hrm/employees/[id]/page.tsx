import { tenantModel } from "@/lib/tenant-db";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";
import { ArrowLeft, CalendarCheck, CalendarOff, ClipboardList, TrendingUp, WalletCards } from "lucide-react";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { connectDB } from "@/lib/db";
import { getHrmAccess } from "@/lib/hr-access";
import { formatDate, formatINR, serialize } from "@/lib/utils";
import "@/models";
import Attendance from "@/models/Attendance";
import Employee from "@/models/Employee";
import HrTask from "@/models/HrTask";
import LeaveRequest from "@/models/LeaveRequest";
import Payroll from "@/models/Payroll";
import PerformanceReview from "@/models/PerformanceReview";
import type { AttendanceDTO, EmployeeDTO, HrTaskDTO, LeaveRequestDTO, PayrollDTO, PerformanceReviewDTO } from "@/types";

export default async function EmployeeDetailPage({ params }: { params:Promise<{id:string}> }) {
  const access=await getHrmAccess();
  if(!access.canManage) redirect("/admin/hrm/employees");
  const {id}=await params;
  if(!isValidObjectId(id)) notFound();
  await connectDB();
  const [employeeRaw,attendanceRaw,leavesRaw,performanceRaw,payrollRaw,tasksRaw]=await Promise.all([
    (await tenantModel(Employee)).findById(id).lean(),
    (await tenantModel(Attendance)).find({employee:id}).sort({date:-1}).lean(),
    (await tenantModel(LeaveRequest)).find({employee:id}).sort({startDate:-1}).lean(),
    (await tenantModel(PerformanceReview)).find({employee:id}).sort({createdAt:-1}).lean(),
    (await tenantModel(Payroll)).find({employee:id}).sort({month:-1}).lean(),
    (await tenantModel(HrTask)).find({employee:id}).sort({dueDate:-1}).lean(),
  ]);
  if(!employeeRaw) notFound();
  const employee=serialize(employeeRaw) as EmployeeDTO;
  const attendance=serialize(attendanceRaw) as AttendanceDTO[];
  const leaves=serialize(leavesRaw) as LeaveRequestDTO[];
  const performance=serialize(performanceRaw) as PerformanceReviewDTO[];
  const payroll=serialize(payrollRaw) as PayrollDTO[];
  const tasks=serialize(tasksRaw) as HrTaskDTO[];
  const totalHours=attendance.reduce((sum,row)=>sum+row.workHours,0);

  return <div className="space-y-6">
    <div><Button asChild variant="ghost" size="sm"><Link href="/admin/hrm/employees"><ArrowLeft/>Employees</Link></Button></div>
    <Card><CardContent className="grid gap-5 p-6 md:grid-cols-[1fr_auto]"><div><div className="flex items-center gap-3"><div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">{employee.name.slice(0,1).toUpperCase()}</div><div><h1 className="text-2xl font-bold">{employee.name}</h1><p className="text-muted-foreground">{employee.designation} · {employee.department}</p></div></div><div className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3"><Detail label="Email" value={employee.email}/><Detail label="Mobile" value={employee.mobile||"—"}/><Detail label="Joined" value={employee.joinedAt?formatDate(employee.joinedAt):"—"}/><Detail label="Salary" value={formatINR(employee.salary)}/><Detail label="Portal access" value={employee.portalAccess?`Enabled · ${employee.portalPages?.length||0} pages`:"Disabled"}/><Detail label="HR access" value={employee.hrAccess==="manage"?"HR manager":"Own records only"}/></div>{employee.notes&&<p className="mt-4 rounded-lg bg-muted p-3 text-sm">{employee.notes}</p>}</div><StatusBadge status={employee.status}/></CardContent></Card>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Summary icon={CalendarCheck} label="Attendance records" value={attendance.length}/><Summary icon={CalendarOff} label="Leave requests" value={leaves.length}/><Summary icon={TrendingUp} label="Reviews" value={performance.length}/><Summary icon={ClipboardList} label="Tasks" value={tasks.length}/></div>
    <Section title="Attendance" icon={CalendarCheck} empty="No attendance records"><Table headers={["Date","Status","Check in","Check out","Hours"]}>{attendance.map((row)=><tr key={row._id} className="border-t"><Cell>{formatDate(row.date)}</Cell><Cell><StatusBadge status={row.status}/></Cell><Cell>{row.checkIn||"—"}</Cell><Cell>{row.checkOut||"—"}</Cell><Cell>{row.workHours}h</Cell></tr>)}</Table>{attendance.length>0&&<p className="border-t p-4 text-right text-sm font-semibold">Total recorded hours: {Number(totalHours.toFixed(2))}h</p>}</Section>
    <Section title="Leave requests" icon={CalendarOff} empty="No leave requests"><Table headers={["Type","Dates","Days","Reason","Status"]}>{leaves.map((row)=><tr key={row._id} className="border-t"><Cell className="capitalize">{row.type}</Cell><Cell>{formatDate(row.startDate)} – {formatDate(row.endDate)}</Cell><Cell>{row.days}</Cell><Cell>{row.reason}</Cell><Cell><StatusBadge status={row.status}/></Cell></tr>)}</Table></Section>
    <Section title="Performance" icon={TrendingUp} empty="No performance reviews"><Table headers={["Period","Score","Reviewer","Feedback","Status"]}>{performance.map((row)=><tr key={row._id} className="border-t"><Cell>{row.period}</Cell><Cell className="font-semibold">{row.score}/5</Cell><Cell>{row.reviewer||"—"}</Cell><Cell>{row.feedback}</Cell><Cell><StatusBadge status={row.status}/></Cell></tr>)}</Table></Section>
    <Section title="Payroll" icon={WalletCards} empty="No payroll records"><Table headers={["Month","Basic salary","Allowances","Deductions","Net pay","Status"]}>{payroll.map((row)=><tr key={row._id} className="border-t"><Cell>{row.month}</Cell><Cell>{formatINR(row.basicSalary)}</Cell><Cell>{formatINR(row.allowances)}</Cell><Cell>{formatINR(row.deductions)}</Cell><Cell className="font-semibold">{formatINR(row.netPay)}</Cell><Cell><StatusBadge status={row.status}/></Cell></tr>)}</Table></Section>
    <Section title="Tasks" icon={ClipboardList} empty="No assigned tasks"><Table headers={["Task","Due date","Priority","Assigned by","Status"]}>{tasks.map((row)=><tr key={row._id} className="border-t"><Cell><p className="font-medium">{row.title}</p>{row.description&&<p className="max-w-md text-xs text-muted-foreground">{row.description}</p>}</Cell><Cell>{formatDate(row.dueDate)}</Cell><Cell className="capitalize">{row.priority}</Cell><Cell>{row.assignedBy||"—"}</Cell><Cell><StatusBadge status={row.status}/></Cell></tr>)}</Table></Section>
  </div>;
}

function Detail({label,value}:{label:string;value:string}){return <div><p className="text-xs text-muted-foreground">{label}</p><p className="font-medium">{value}</p></div>}
function Summary({icon:Icon,label,value}:{icon:typeof CalendarCheck;label:string;value:number}){return <Card><CardContent className="flex items-center gap-3 p-4"><div className="rounded-lg bg-primary/10 p-2 text-primary"><Icon/></div><div><p className="text-2xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div></CardContent></Card>}
function Section({title,icon:Icon,empty,children}:{title:string;icon:typeof CalendarCheck;empty:string;children:React.ReactNode}){return <Card><CardHeader><CardTitle className="flex items-center gap-2"><Icon className="size-5 text-primary"/>{title}</CardTitle></CardHeader><CardContent className="overflow-x-auto p-0">{Array.isArray(children)&&children.length===0?<p className="px-6 pb-6 text-sm text-muted-foreground">{empty}</p>:children}</CardContent></Card>}
function Table({headers,children}:{headers:string[];children:React.ReactNode}){const hasRows=Array.isArray(children)?children.length>0:Boolean(children);if(!hasRows)return <p className="px-6 pb-6 text-sm text-muted-foreground">No records found.</p>;return <table className="w-full min-w-[650px] text-sm"><thead><tr className="text-left text-muted-foreground">{headers.map((header)=><th key={header} className="p-4 font-medium">{header}</th>)}</tr></thead><tbody>{children}</tbody></table>}
function Cell({children,className=""}:{children:React.ReactNode;className?:string}){return <td className={`p-4 ${className}`}>{children}</td>}

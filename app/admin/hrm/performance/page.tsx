import { redirect } from "next/navigation";
import { TrendingUp } from "lucide-react";
import { HrRecordDrawer } from "@/components/admin/hr-record-drawer";
import { HrmListFilters } from "@/components/admin/hrm-list-filters";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { listAdminEmployees, listAdminPerformanceReviews } from "@/lib/dashboard";
import { getHrmAccess } from "@/lib/hr-access";
import type { EmployeeDTO, PerformanceReviewDTO } from "@/types";

export default async function Page({searchParams}:{searchParams:Promise<{search?:string}>}) {
  const access=await getHrmAccess(); if(!access.canManage)redirect("/admin/hrm");
  const[allRecords,employees,{search=""}]=await Promise.all([listAdminPerformanceReviews() as Promise<PerformanceReviewDTO[]>,listAdminEmployees() as Promise<EmployeeDTO[]>,searchParams]);
  const query=search.toLowerCase();
  const records=allRecords.filter((record)=>{const employee=typeof record.employee==="string"?"":`${record.employee.name} ${record.employee.email}`;return!query||`${employee} ${record.period} ${record.reviewer} ${record.feedback} ${record.goals} ${record.achievements}`.toLowerCase().includes(query)});
  return <div className="space-y-5"><div className="flex justify-between"><div><h2 className="text-xl font-bold">Performance</h2><p className="text-muted-foreground">Employee reviews, goals and feedback</p></div><HrRecordDrawer kind="performance" employees={employees}/></div><HrmListFilters search={search} placeholder="Search employee, reviewer, period or feedback..."/>{records.length?<Card><CardContent className="overflow-x-auto p-0"><table className="w-full text-sm"><thead><tr>{["Employee","Period","Score","Reviewer","Feedback","Status","Action"].map((heading)=><th className="p-4 text-left" key={heading}>{heading}</th>)}</tr></thead><tbody>{records.map((record)=>{const employee=typeof record.employee==="string"?null:record.employee;return <tr className="border-t" key={record._id}><td className="p-4 font-medium">{employee?.name||"Employee"}</td><td className="p-4">{record.period}</td><td className="p-4 font-bold">{record.score}/5</td><td className="p-4">{record.reviewer||"—"}</td><td className="max-w-xs p-4"><p className="line-clamp-2">{record.feedback}</p></td><td className="p-4"><StatusBadge status={record.status}/></td><td className="p-4"><HrRecordDrawer kind="performance" employees={employees} record={record}/></td></tr>})}</tbody></table></CardContent></Card>:<EmptyState icon={TrendingUp} title={search?"No matching performance reviews":"No performance reviews"}/>}</div>;
}

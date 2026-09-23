import { ListTodo } from "lucide-react";
import { HrRecordDrawer } from "@/components/admin/hr-record-drawer";
import { HrmListFilters } from "@/components/admin/hrm-list-filters";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { HR_TASK_STATUSES } from "@/lib/constants";
import { listAdminEmployees, listAdminHrTasks } from "@/lib/dashboard";
import { formatDate } from "@/lib/utils";
import type { EmployeeDTO, HrTaskDTO } from "@/types";

export default async function Page({searchParams}:{searchParams:Promise<{search?:string;status?:string}>}) {
  const [{search="",status=""},allRecords,employees]=await Promise.all([searchParams,listAdminHrTasks() as Promise<HrTaskDTO[]>,listAdminEmployees() as Promise<EmployeeDTO[]>]);
  const query=search.toLowerCase();
  const records=allRecords.filter((record)=>{const employee=typeof record.employee==="string"?"":`${record.employee.name} ${record.employee.email}`;return (!status||record.status===status)&&(!query||`${record.title} ${record.description} ${record.assignedBy} ${employee}`.toLowerCase().includes(query))});
  return <div className="space-y-5"><div className="flex justify-between"><div><h2 className="text-xl font-bold">Task Management</h2><p className="text-muted-foreground">Assign and monitor employee work</p></div><HrRecordDrawer kind="task" employees={employees}/></div><HrmListFilters search={search} status={status} statuses={HR_TASK_STATUSES} placeholder="Search task, employee or assigned by..."/>{records.length?<Card><CardContent className="overflow-x-auto p-0"><table className="w-full text-sm"><thead><tr>{["Task","Assigned To","Due","Priority","Assigned by","Status","Action"].map((heading)=><th className="p-4 text-left" key={heading}>{heading}</th>)}</tr></thead><tbody>{records.map((record)=>{const employee=typeof record.employee==="string"?null:record.employee;return <tr className="border-t" key={record._id}><td className="max-w-xs p-4"><p className="font-medium">{record.title}</p><p className="line-clamp-1 text-xs text-muted-foreground">{record.description}</p></td><td className="p-4">{employee?.name||"Employee"}</td><td className="p-4">{formatDate(record.dueDate)}</td><td className="p-4"><Badge variant={record.priority==="urgent"?"destructive":"secondary"}>{record.priority}</Badge></td><td className="p-4">{record.assignedBy||"—"}</td><td className="p-4"><StatusBadge status={record.status}/></td><td className="p-4"><HrRecordDrawer kind="task" employees={employees} record={record}/></td></tr>})}</tbody></table></CardContent></Card>:<EmptyState icon={ListTodo} title={search||status?"No matching tasks":"No tasks assigned"}/>}</div>;
}

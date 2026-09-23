import { CalendarOff } from "lucide-react";
import { HrRecordDrawer } from "@/components/admin/hr-record-drawer";
import { HrmListFilters } from "@/components/admin/hrm-list-filters";
import { SelfLeaveRequestDrawer } from "@/components/admin/self-leave-request-drawer";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { listAdminEmployees, listAdminLeaveRequests } from "@/lib/dashboard";
import { LEAVE_REQUEST_STATUSES } from "@/lib/constants";
import { getHrmAccess } from "@/lib/hr-access";
import { formatDate } from "@/lib/utils";
import type { EmployeeDTO, LeaveRequestDTO } from "@/types";

export default async function Page({searchParams}:{searchParams:Promise<{search?:string;status?:string}>}) {
  const [{ canManage }, allRecords, employees, {search="",status=""}] = await Promise.all([
    getHrmAccess(), listAdminLeaveRequests() as Promise<LeaveRequestDTO[]>, listAdminEmployees() as Promise<EmployeeDTO[]>, searchParams,
  ]);
  const query=search.toLowerCase();
  const records=allRecords.filter((record)=>{const employee=typeof record.employee==="string"?"":`${record.employee.name} ${record.employee.email}`;return(!status||record.status===status)&&(!query||`${employee} ${record.type} ${record.reason}`.toLowerCase().includes(query))});
  return <div className="space-y-5">
    <div className="flex justify-between"><div><h2 className="text-xl font-bold">Leave Request</h2><p className="text-muted-foreground">Requests, approvals and leave history</p></div>{canManage ? <HrRecordDrawer kind="leave" employees={employees}/> : <SelfLeaveRequestDrawer/>}</div>
    <HrmListFilters search={search} status={status} statuses={LEAVE_REQUEST_STATUSES} placeholder="Search employee, leave type or reason..."/>
    {records.length ? <Card><CardContent className="overflow-x-auto p-0"><table className="w-full text-sm"><thead><tr>{["Employee","Type","Dates","Days","Reason","Status",...(canManage?["Action"]:[])].map((heading)=><th className="p-4 text-left" key={heading}>{heading}</th>)}</tr></thead><tbody>{records.map((record)=>{const employee=typeof record.employee==="string"?null:record.employee;return <tr className="border-t" key={record._id}><td className="p-4 font-medium">{employee?.name||"Employee"}</td><td className="p-4 capitalize">{record.type}</td><td className="p-4">{formatDate(record.startDate)} – {formatDate(record.endDate)}</td><td className="p-4">{record.days}</td><td className="max-w-xs p-4"><p className="line-clamp-2">{record.reason}</p></td><td className="p-4"><StatusBadge status={record.status}/></td>{canManage&&<td className="p-4"><HrRecordDrawer kind="leave" employees={employees} record={record}/></td>}</tr>})}</tbody></table></CardContent></Card> : <EmptyState icon={CalendarOff} title="No leave requests"/>}
  </div>;
}

import { tenantModel } from "@/lib/tenant-db";
import { AttendanceCalendar } from "@/components/attendance-calendar";
import { HrRecordDrawer } from "@/components/hr-record-drawer";
import { connectDB } from "@/lib/db";
import { listTenantAttendance, listTenantEmployees, listAttendanceRegularizations } from "@/lib/dashboard";
import { getCurrentUser } from "@/lib/session";
import Employee from "@/models/Employee";
import type { AttendanceDTO, AttendanceRegularizationDTO, EmployeeDTO } from "@/types";

function indiaDateParts() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone:"Asia/Kolkata", year:"numeric", month:"2-digit", day:"2-digit" }).formatToParts(new Date());
  const value=Object.fromEntries(parts.map((part)=>[part.type,part.value]));
  return { today:`${value.year}-${value.month}-${value.day}`, month:`${value.year}-${value.month}` };
}

export default async function Page() {
  const user=await getCurrentUser();
  await connectDB();
  const profile=user?.role==="tenant_employee" ? await (await tenantModel(Employee)).findOne({user:user.id,status:"active",portalAccess:true}).select("_id hrAccess").lean<{_id:unknown;hrAccess?:"self"|"manage"}>() : null;
  const canManage=user?.role==="tenant"||profile?.hrAccess==="manage";
  const currentEmployeeId=profile?String(profile._id):undefined;
  const [records,employees,requests]=await Promise.all([
    listTenantAttendance() as Promise<AttendanceDTO[]>,
    listTenantEmployees() as Promise<EmployeeDTO[]>,
    listAttendanceRegularizations() as Promise<AttendanceRegularizationDTO[]>,
  ]);
  const {today,month}=indiaDateParts();
  return <AttendanceCalendar records={records} requests={requests} employees={employees} currentEmployeeId={currentEmployeeId} canManage={canManage} initialMonth={month} today={today} action={canManage?<HrRecordDrawer kind="attendance" employees={employees}/>:undefined}/>;
}

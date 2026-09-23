import { EmployeeSection } from "@/components/admin/employee-section";
import { HrmListFilters } from "@/components/admin/hrm-list-filters";
import { listAdminEmployees } from "@/lib/dashboard";
import { getHrmAccess } from "@/lib/hr-access";
import type { EmployeeDTO } from "@/types";

export default async function HrmEmployeesPage({searchParams}:{searchParams:Promise<{search?:string}>}) {
  const[{canManage},allEmployees,{search=""}]=await Promise.all([getHrmAccess(),listAdminEmployees() as Promise<EmployeeDTO[]>,searchParams]);
  const query=search.toLowerCase();
  const employees=allEmployees.filter((employee)=>!query||`${employee.name} ${employee.email} ${employee.mobile||""} ${employee.designation} ${employee.department}`.toLowerCase().includes(query));
  return <EmployeeSection employees={employees} canManage={canManage} filters={<HrmListFilters search={search} placeholder="Search name, email, role or department..."/>}/>;
}

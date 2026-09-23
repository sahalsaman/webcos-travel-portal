import { HrmListFilters } from "@/components/admin/hrm-list-filters";
import { PayrollSection } from "@/components/admin/payroll-section";
import { PAYROLL_STATUSES } from "@/lib/constants";
import { listAdminEmployees, listAdminPayroll } from "@/lib/dashboard";
import { getHrmAccess } from "@/lib/hr-access";
import type { EmployeeDTO, PayrollDTO } from "@/types";

export default async function HrmPayrollPage({searchParams}:{searchParams:Promise<{search?:string;status?:string}>}) {
  const [{canManage},employees,allPayroll,{search="",status=""}]=await Promise.all([getHrmAccess(),listAdminEmployees() as Promise<EmployeeDTO[]>,listAdminPayroll() as Promise<PayrollDTO[]>,searchParams]);
  const query=search.toLowerCase();
  const payroll=allPayroll.filter((record)=>{const employee=typeof record.employee==="string"?"":`${record.employee.name} ${record.employee.email} ${record.employee.designation}`;return(!status||record.status===status)&&(!query||`${employee} ${record.month} ${record.paymentReference}`.toLowerCase().includes(query))});
  return <PayrollSection employees={employees} payroll={payroll} canManage={canManage} filters={<HrmListFilters search={search} status={status} statuses={PAYROLL_STATUSES} placeholder="Search employee, month or payment reference..."/>}/>;
}

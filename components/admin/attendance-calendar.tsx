"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Clock3, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { AttendanceDTO, AttendanceRegularizationDTO, EmployeeDTO } from "@/types";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const statusStyle: Record<string, string> = { present:"bg-emerald-100 text-emerald-700", late:"bg-amber-100 text-amber-700", half_day:"bg-orange-100 text-orange-700", work_from_home:"bg-blue-100 text-blue-700", on_leave:"bg-violet-100 text-violet-700", absent:"bg-red-100 text-red-700" };

function employeeId(value: AttendanceDTO["employee"] | AttendanceRegularizationDTO["employee"]) { return typeof value === "string" ? value : value._id; }
function isoDay(value: string) { return value.slice(0, 10); }

export function AttendanceCalendar({ records, requests, employees, currentEmployeeId, canManage, initialMonth, today, action }: { records:AttendanceDTO[]; requests:AttendanceRegularizationDTO[]; employees:EmployeeDTO[]; currentEmployeeId?:string; canManage:boolean; initialMonth:string; today:string; action?:React.ReactNode }) {
  const router = useRouter();
  const [month, setMonth] = useState(initialMonth);
  const [selectedEmployee, setSelectedEmployee] = useState(currentEmployeeId ?? employees[0]?._id ?? "");
  const [requestDate, setRequestDate] = useState<string | null>(null);
  const [busy, setBusy] = useState("");
  const visibleRecords = useMemo(() => records.filter((row) => employeeId(row.employee) === selectedEmployee), [records, selectedEmployee]);
  const visibleRequests = useMemo(() => requests.filter((row) => employeeId(row.employee) === selectedEmployee), [requests, selectedEmployee]);
  const recordByDate = new Map(visibleRecords.map((row) => [isoDay(row.date), row]));
  const requestByDate = new Map(visibleRequests.map((row) => [isoDay(row.date), row]));
  const [year, monthNumber] = month.split("-").map(Number);
  const firstDay = new Date(Date.UTC(year, monthNumber - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const cells = Array.from({ length: Math.ceil((firstDay + daysInMonth) / 7) * 7 }, (_, index) => index - firstDay + 1);
  const monthLabel = new Intl.DateTimeFormat("en-IN", { month:"long", year:"numeric", timeZone:"UTC" }).format(new Date(Date.UTC(year, monthNumber - 1, 1)));
  const ownCalendar = Boolean(currentEmployeeId && selectedEmployee === currentEmployeeId);
  const pending = requests.filter((request) => request.status === "pending");

  function changeMonth(delta:number) {
    const next = new Date(Date.UTC(year, monthNumber - 1 + delta, 1));
    setMonth(`${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`);
  }

  async function review(id:string, status:"approved"|"rejected") {
    setBusy(id + status);
    try {
      const response = await fetch("/api/admin/attendance/regularization", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ id, status }) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "Could not review request");
      toast.success(`Request ${status}`);
      router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Something went wrong"); }
    finally { setBusy(""); }
  }

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div><h2 className="text-xl font-bold">Attendance calendar</h2><p className="text-sm text-muted-foreground">View daily attendance and regularize missed check-ins.</p></div>
      {canManage && <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end lg:w-auto"><div className="w-full sm:w-72"><Label htmlFor="calendar-employee">Employee</Label><Select id="calendar-employee" value={selectedEmployee} onChange={(event)=>setSelectedEmployee(event.target.value)}>{employees.map((employee)=><option key={employee._id} value={employee._id}>{employee.name} — {employee.department}</option>)}</Select></div>{action}</div>}
    </div>

    <Card><CardContent className="p-3 sm:p-5">
      <div className="mb-4 flex items-center justify-between"><Button variant="outline" size="icon" onClick={()=>changeMonth(-1)} aria-label="Previous month"><ChevronLeft/></Button><div className="text-center"><p className="text-lg font-bold">{monthLabel}</p><button className="text-xs text-primary hover:underline" onClick={()=>setMonth(initialMonth)}>Current month</button></div><Button variant="outline" size="icon" onClick={()=>changeMonth(1)} aria-label="Next month"><ChevronRight/></Button></div>
      <div className="grid grid-cols-7 border-l border-t">{weekDays.map((day)=><div key={day} className="border-b border-r bg-muted/50 p-2 text-center text-xs font-semibold text-muted-foreground">{day}</div>)}
        {cells.map((day,index)=>{
          if(day < 1 || day > daysInMonth) return <div key={index} className="min-h-24 border-b border-r bg-muted/20 sm:min-h-32"/>;
          const date=`${month}-${String(day).padStart(2,"0")}`; const record=recordByDate.get(date); const request=requestByDate.get(date); const canRequest=ownCalendar && date<=today && !record?.checkIn && request?.status!=="pending" && request?.status!=="approved";
          return <div key={date} className={cn("min-h-24 border-b border-r p-1.5 sm:min-h-32 sm:p-2",date===today&&"ring-2 ring-inset ring-primary")}><div className="flex justify-between"><span className={cn("text-sm font-semibold",date===today&&"text-primary")}>{day}</span>{record&&<span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold",statusStyle[record.status])}>{record.status.replaceAll("_"," ")}</span>}</div>
            {record ? <div className="mt-2 space-y-1 text-[11px] text-muted-foreground sm:text-xs"><p>{record.checkIn||"—"} → {record.checkOut||"—"}</p><p className="font-medium text-foreground">{record.workHours}h worked</p></div> : <p className="mt-2 text-[11px] text-muted-foreground sm:text-xs">No attendance</p>}
            {request&&<span className={cn("mt-2 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium",request.status==="pending"?"bg-amber-100 text-amber-700":request.status==="approved"?"bg-emerald-100 text-emerald-700":"bg-red-100 text-red-700")}>{request.status}</span>}
            {canRequest&&<button onClick={()=>setRequestDate(date)} className="mt-2 block text-[11px] font-semibold text-primary hover:underline sm:text-xs">Regularize</button>}
          </div>;
        })}
      </div>
    </CardContent></Card>

    {canManage&&<Card><CardContent className="p-5"><div className="mb-4 flex items-center gap-2"><Clock3 className="size-5 text-primary"/><h3 className="font-bold">Pending regularizations ({pending.length})</h3></div>{pending.length===0?<p className="text-sm text-muted-foreground">No requests waiting for review.</p>:<div className="space-y-3">{pending.map((request)=>{const employee=typeof request.employee==="string"?null:request.employee;return <div key={request._id} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{employee?.name||"Employee"} · {isoDay(request.date)}</p><p className="text-sm">{request.requestedCheckIn} → {request.requestedCheckOut}</p><p className="text-sm text-muted-foreground">{request.reason}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" disabled={Boolean(busy)} onClick={()=>review(request._id,"rejected")}>{busy===request._id+"rejected"&&<Loader2 className="animate-spin"/>}Reject</Button><Button size="sm" disabled={Boolean(busy)} onClick={()=>review(request._id,"approved")}>{busy===request._id+"approved"&&<Loader2 className="animate-spin"/>}Approve</Button></div></div>})}</div>}</CardContent></Card>}
    {requestDate&&<RegularizationDialog date={requestDate} close={()=>setRequestDate(null)} />}
  </div>;
}

function RegularizationDialog({date,close}:{date:string;close:()=>void}) {
  const router=useRouter(); const[busy,setBusy]=useState(false);
  async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);const data=new FormData(event.currentTarget);try{const response=await fetch("/api/admin/attendance/regularization",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({date,requestedCheckIn:data.get("checkIn"),requestedCheckOut:data.get("checkOut"),reason:data.get("reason")})});const json=await response.json();if(!response.ok)throw new Error(json.message||"Could not submit request");toast.success("Regularization request sent to HR");close();router.refresh()}catch(error){toast.error(error instanceof Error?error.message:"Something went wrong")}finally{setBusy(false)}}
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><form onSubmit={submit} className="w-full max-w-md space-y-4 rounded-xl bg-background p-5 shadow-xl"><div className="flex items-start justify-between"><div><h3 className="text-lg font-bold">Regularize attendance</h3><p className="text-sm text-muted-foreground">{date}</p></div><Button type="button" variant="ghost" size="icon" onClick={close}><X/></Button></div><div className="grid grid-cols-2 gap-3"><div><Label htmlFor="regularize-in">Check in</Label><Input id="regularize-in" name="checkIn" type="time" required/></div><div><Label htmlFor="regularize-out">Check out</Label><Input id="regularize-out" name="checkOut" type="time" required/></div></div><div><Label htmlFor="regularize-reason">Reason</Label><Textarea id="regularize-reason" name="reason" required minLength={5} placeholder="Why was attendance missed?"/></div><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={close}>Cancel</Button><Button disabled={busy}>{busy&&<Loader2 className="animate-spin"/>}Send request</Button></div></form></div>;
}

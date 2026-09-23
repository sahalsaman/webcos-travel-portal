"use client";

import { useEffect, useState } from "react";
import { Clock3, LogIn, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface AttendanceRecord { checkIn?: string; checkOut?: string; workHours?: number }

const clockValue = (date: Date) => new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }).format(date);
const dayValue = (date: Date) => new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(date);

export function AttendanceClockCard() {
  // Keep the server output and the first browser render identical. The live
  // value starts after hydration, avoiding time/locale-dependent mismatches.
  const [now, setNow] = useState<Date | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [record, setRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => { fetch("/api/admin/attendance/me", { cache: "no-store" }).then((response) => response.json()).then((payload) => { if (payload.success) { setAvailable(payload.data.available); setRecord(payload.data.record); } }).catch(() => setAvailable(false)); }, []);

  async function updateAttendance(action: "check-in" | "check-out") {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/attendance/me", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to update attendance");
      setRecord(payload.data);
      toast.success(action === "check-in" ? "Checked in successfully" : "Checked out successfully");
    } catch (error) { toast.error((error as Error).message); } finally { setLoading(false); }
  }

  const nextAction = !record?.checkIn ? "check-in" : !record.checkOut ? "check-out" : null;
  return <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card"><CardContent className="flex flex-col items-center justify-between gap-6 p-6 text-center sm:flex-row sm:text-left"><div><p className="flex items-center justify-center gap-2 text-sm font-semibold text-primary sm:justify-start"><Clock3 className="size-4"/>Today&apos;s attendance</p><p className="mt-2 text-4xl font-black tabular-nums tracking-tight sm:text-5xl">{now ? clockValue(now) : "--:--:-- --"}</p><p className="mt-2 text-sm text-muted-foreground">{now ? dayValue(now) : "Loading date"} · India Standard Time</p></div><div className="min-w-56 rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm">{available===false?<p className="text-sm text-muted-foreground">Attendance actions are available to active employees with portal access.</p>:available===null?<p className="text-sm text-muted-foreground">Loading attendance…</p>:<><div className="mb-4 grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-muted-foreground">Check in</p><p className="font-bold">{record?.checkIn||"—"}</p></div><div><p className="text-xs text-muted-foreground">Check out</p><p className="font-bold">{record?.checkOut||"—"}</p></div></div>{nextAction?<Button className="w-full" variant={nextAction==="check-in"?"gradient":"default"} disabled={loading} onClick={()=>void updateAttendance(nextAction)}>{nextAction==="check-in"?<LogIn className="size-4"/>:<LogOut className="size-4"/>}{loading?"Saving…":nextAction==="check-in"?"Check in":"Check out"}</Button>:<p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-700">Attendance completed · {record?.workHours??0}h</p>}</>}</div></CardContent></Card>;
}

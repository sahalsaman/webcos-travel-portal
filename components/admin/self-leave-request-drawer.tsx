"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LEAVE_TYPES } from "@/lib/constants";

export function SelfLeaveRequestDrawer() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: data.get("type"), startDate: data.get("startDate"), endDate: data.get("endDate"),
          days: Number(data.get("days")), reason: data.get("reason"), status: "pending",
        }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "Unable to submit leave request");
      toast.success("Leave request submitted");
      setOpen(false);
      router.refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Something went wrong"); }
    finally { setLoading(false); }
  }

  return <>
    <Button variant="gradient" onClick={() => setOpen(true)}><Plus/>Add Leave Request</Button>
    {open && <div className="fixed inset-0 z-[80]"><button className="absolute inset-0 bg-black/45" onClick={() => setOpen(false)}/><aside role="dialog" className="absolute right-0 top-0 flex h-full w-full max-w-lg flex-col border-l bg-background shadow-2xl"><div className="flex items-center justify-between border-b px-5 py-4"><div><h2 className="text-lg font-bold">Add Leave Request</h2><p className="text-sm text-muted-foreground">Submit a request for your own leave.</p></div><Button variant="ghost" size="icon" onClick={() => setOpen(false)}><X/></Button></div><form onSubmit={submit} className="flex flex-1 flex-col"><div className="grid flex-1 content-start gap-5 overflow-y-auto p-5 sm:grid-cols-2"><div><Label htmlFor="self-leave-type">Leave type</Label><Select id="self-leave-type" name="type" defaultValue="annual">{LEAVE_TYPES.map((type) => <option key={type}>{type}</option>)}</Select></div><div><Label htmlFor="self-leave-days">Days</Label><Input id="self-leave-days" name="days" type="number" min={0.5} step={0.5} defaultValue={1} required/></div><div><Label htmlFor="self-leave-start">Start date</Label><Input id="self-leave-start" name="startDate" type="date" required/></div><div><Label htmlFor="self-leave-end">End date</Label><Input id="self-leave-end" name="endDate" type="date" required/></div><div className="sm:col-span-2"><Label htmlFor="self-leave-reason">Reason</Label><Textarea id="self-leave-reason" name="reason" minLength={2} required/></div></div><div className="flex justify-end gap-2 border-t p-5"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={loading}>{loading && <Loader2 className="animate-spin"/>}Submit request</Button></div></form></aside></div>}
  </>;
}

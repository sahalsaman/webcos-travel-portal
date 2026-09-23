"use client";

import { useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { EmployeeForm } from "@/components/admin/employee-form";
import { Button } from "@/components/ui/button";
import type { EmployeeDTO } from "@/types";

export function EmployeeDrawer({ employee }: { employee?: EmployeeDTO }) {
  const [open, setOpen] = useState(false);
  return <>
    {employee ? <Button type="button" variant="ghost" size="icon" aria-label={`Edit ${employee.name}`} onClick={() => setOpen(true)}><Pencil className="size-4" /></Button> : <Button type="button" variant="gradient" onClick={() => setOpen(true)}><Plus className="size-4" />New Employee</Button>}
    {open ? <div className="fixed inset-0 z-[80]"><button type="button" className="absolute inset-0 bg-black/45" onClick={() => setOpen(false)} aria-label="Close employee form" /><aside role="dialog" aria-modal="true" className="absolute right-0 top-0 flex h-full w-full max-w-3xl flex-col border-l border-border bg-background shadow-2xl"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="text-lg font-bold">{employee ? "Edit Employee" : "New Employee"}</h2><p className="text-sm text-muted-foreground">{employee?.name ?? "Add an internal team member"}</p></div><Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close"><X className="size-5" /></Button></div><div className="min-h-0 flex-1 overflow-y-auto p-5"><EmployeeForm employee={employee} onSaved={() => setOpen(false)} onCancel={() => setOpen(false)} /></div></aside></div> : null}
  </>;
}

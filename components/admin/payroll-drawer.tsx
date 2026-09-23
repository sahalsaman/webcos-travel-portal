"use client";

import { useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PayrollForm } from "@/components/admin/payroll-form";
import type { EmployeeDTO, PayrollDTO } from "@/types";

export function PayrollDrawer({ payroll, employees }: { payroll?: PayrollDTO; employees: EmployeeDTO[] }) {
  const [open, setOpen] = useState(false);
  const editing = Boolean(payroll);
  return (
    <>
      {editing ? (
        <Button type="button" variant="ghost" size="icon" aria-label="Edit payroll" onClick={() => setOpen(true)}><Pencil className="size-4" /></Button>
      ) : (
        <Button type="button" variant="gradient" onClick={() => setOpen(true)}><Plus className="size-4" /> Add Payroll</Button>
      )}
      {open ? (
        <div className="fixed inset-0 z-[80]">
          <button type="button" className="absolute inset-0 bg-black/45" onClick={() => setOpen(false)} aria-label="Close payroll form" />
          <aside role="dialog" aria-modal="true" aria-labelledby="payroll-drawer-title" className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col border-l border-border bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="min-w-0 pr-3"><h2 id="payroll-drawer-title" className="text-lg font-bold">{editing ? "Edit Payroll" : "Add Payroll"}</h2><p className="truncate text-sm text-muted-foreground">Process monthly employee earnings and deductions</p></div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close"><X className="size-5" /></Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5"><PayrollForm payroll={payroll} employees={employees} onSaved={() => setOpen(false)} onCancel={() => setOpen(false)} /></div>
          </aside>
        </div>
      ) : null}
    </>
  );
}

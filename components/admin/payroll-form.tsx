"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PAYROLL_STATUSES } from "@/lib/constants";
import { formatINR } from "@/lib/utils";
import type { EmployeeDTO, PayrollDTO } from "@/types";

function defaultMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function employeeId(payroll?: PayrollDTO) {
  if (!payroll) return "";
  return typeof payroll.employee === "string" ? payroll.employee : payroll.employee._id;
}

export function PayrollForm({ payroll, employees, onSaved, onCancel }: { payroll?: PayrollDTO; employees: EmployeeDTO[]; onSaved: () => void; onCancel: () => void }) {
  const router = useRouter();
  const editing = Boolean(payroll);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    employeeId: employeeId(payroll),
    month: payroll?.month ?? defaultMonth(),
    basicSalary: payroll?.basicSalary ?? 0,
    allowances: payroll?.allowances ?? 0,
    deductions: payroll?.deductions ?? 0,
    status: payroll?.status ?? "draft",
    paymentDate: payroll?.paymentDate?.slice(0, 10) ?? "",
    paymentReference: payroll?.paymentReference ?? "",
    notes: payroll?.notes ?? "",
  });
  const netPay = Math.max(0, Number(form.basicSalary) + Number(form.allowances) - Number(form.deductions));

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function selectEmployee(id: string) {
    const employee = employees.find((item) => item._id === id);
    setForm((current) => ({ ...current, employeeId: id, basicSalary: employee?.salary ?? current.basicSalary }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(editing ? `/api/admin/payroll/${payroll!._id}` : "/api/admin/payroll", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, basicSalary: Number(form.basicSalary), allowances: Number(form.allowances), deductions: Number(form.deductions) }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to save payroll");
      toast.success(editing ? "Payroll updated" : "Payroll created");
      router.refresh();
      onSaved();
    } catch (error) {
      toast.error((error as Error).message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid items-start gap-x-4 gap-y-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Employee <span className="text-destructive">*</span></Label>
            <Select value={form.employeeId} onChange={(event) => selectEmployee(event.target.value)} required>
              <option value="">Select employee</option>
              {employees.map((employee) => <option key={employee._id} value={employee._id}>{employee.name} — {employee.designation}</option>)}
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">Payroll month <span className="text-destructive">*</span></Label>
            <Input type="month" value={form.month} onChange={(event) => set("month", event.target.value)} required />
          </div>
          <div>
            <Label className="mb-1.5 block">Status</Label>
            <Select value={form.status} onChange={(event) => set("status", event.target.value as typeof form.status)}>
              {PAYROLL_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">Basic salary <span className="text-destructive">*</span></Label>
            <Input type="number" min={0} step="0.01" value={form.basicSalary} onChange={(event) => set("basicSalary", Number(event.target.value))} required />
          </div>
          <div>
            <Label className="mb-1.5 block">Allowances</Label>
            <Input type="number" min={0} step="0.01" value={form.allowances} onChange={(event) => set("allowances", Number(event.target.value))} />
          </div>
          <div>
            <Label className="mb-1.5 block">Deductions</Label>
            <Input type="number" min={0} step="0.01" value={form.deductions} onChange={(event) => set("deductions", Number(event.target.value))} />
          </div>
          <div>
            <Label className="mb-1.5 block">Net pay</Label>
            <div className="flex h-10 items-center rounded-md border border-border bg-secondary/40 px-3 text-sm font-bold">
              {formatINR(netPay)}
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Payment date</Label>
            <Input type="date" value={form.paymentDate} onChange={(event) => set("paymentDate", event.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block">Payment reference</Label>
            <Input value={form.paymentReference} onChange={(event) => set("paymentReference", event.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Notes</Label>
            <Textarea value={form.notes} onChange={(event) => set("notes", event.target.value)} className="min-h-24" />
          </div>
      </div>
      <div className="sticky bottom-0 z-10 -mx-5 -mb-5 flex flex-col-reverse gap-2 border-t border-border bg-background/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="gradient" className="w-full sm:w-auto" disabled={loading}>{loading ? <Loader2 className="size-4 animate-spin" /> : null}{editing ? "Save payroll" : "Create payroll"}</Button>
      </div>
    </form>
  );
}

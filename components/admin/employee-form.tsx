"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ADMIN_PORTAL_PAGES, EMPLOYEE_STATUSES, suggestedEmployeePortalPages, type AdminPortalPageKey } from "@/lib/constants";
import type { EmployeeDTO } from "@/types";

function toDateInput(value?: string) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

function RequiredMark() {
  return <span className="text-destructive">*</span>;
}

export function EmployeeForm({ employee, onSaved, onCancel }: { employee?: EmployeeDTO; onSaved?: () => void; onCancel?: () => void }) {
  const router = useRouter();
  const editing = Boolean(employee);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: employee?.name ?? "",
    email: employee?.email ?? "",
    mobile: employee?.mobile ?? "",
    designation: employee?.designation ?? "",
    department: employee?.department ?? "Operations",
    status: employee?.status ?? "active",
    salary: employee?.salary ?? 0,
    joinedAt: toDateInput(employee?.joinedAt),
    portalAccess: Boolean(employee?.portalAccess),
    portalPassword: "",
    portalPages: employee?.portalPages ?? ["dashboard" as AdminPortalPageKey],
    hrAccess: employee?.hrAccess ?? "self" as "self" | "manage",
    notes: employee?.notes ?? "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function onDesignationBlur() {
    if (!form.portalAccess || employee?.portalPages?.length) return;
    set("portalPages", suggestedEmployeePortalPages(form.designation) as AdminPortalPageKey[]);
  }

  function togglePage(page: AdminPortalPageKey) {
    setForm((current) => {
      const pages = new Set(current.portalPages);
      if (pages.has(page)) pages.delete(page);
      else pages.add(page);
      return { ...current, portalPages: [...pages] as AdminPortalPageKey[] };
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.portalAccess && form.portalPages.length === 0) {
      toast.error("Select at least one portal page");
      return;
    }
    if (form.portalAccess && !editing && form.portalPassword.length < 6) {
      toast.error("Portal password must be at least 6 characters");
      return;
    }
    if (form.portalPassword && form.portalPassword.length < 6) {
      toast.error("Portal password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(editing ? `/api/admin/employees/${employee!._id}` : "/api/admin/employees", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          salary: Number(form.salary) || 0,
          portalPages: form.portalAccess ? form.portalPages : [],
          portalPassword: form.portalPassword || undefined,
        }),
      });
      const data = await res.json();
      const firstError = data.errors ? Object.values(data.errors).flat().filter(Boolean)[0] : null;
      if (!res.ok || !data.success) throw new Error(String(firstError || data.message || "Save failed"));
      toast.success(editing ? "Employee updated" : "Employee added");
      if (onSaved) onSaved();
      else router.push("/admin/settings?section=employees");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid items-start gap-x-4 gap-y-5 sm:grid-cols-2">
          <div>
            <Label className="mb-1.5 block">Name <RequiredMark /></Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </div>
          <div>
            <Label className="mb-1.5 block">Email <RequiredMark /></Label>
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
          </div>
          <div>
            <Label className="mb-1.5 block">Mobile</Label>
            <Input value={form.mobile} onChange={(e) => set("mobile", e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block">Designation <RequiredMark /></Label>
            <Input value={form.designation} onChange={(e) => set("designation", e.target.value)} onBlur={onDesignationBlur} required />
          </div>
          <div>
            <Label className="mb-1.5 block">Department</Label>
            <Input value={form.department} onChange={(e) => set("department", e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block">Status</Label>
            <Select value={form.status} onChange={(e) => set("status", e.target.value as typeof form.status)}>
              {EMPLOYEE_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">Monthly salary</Label>
            <Input type="number" min={0} value={form.salary} onChange={(e) => set("salary", Number(e.target.value))} />
          </div>
          <div>
            <Label className="mb-1.5 block">Joined date</Label>
            <Input type="date" value={form.joinedAt} onChange={(e) => set("joinedAt", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5 flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.portalAccess}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setForm((current) => ({
                    ...current,
                    portalAccess: checked,
                    portalPages: checked && current.portalPages.length === 0
                      ? suggestedEmployeePortalPages(current.designation) as AdminPortalPageKey[]
                      : current.portalPages,
                  }));
                }}
                className="size-4 rounded border-input"
              />
              Portal access
            </Label>
            <p className="text-xs text-muted-foreground">Allow this employee to log in and open selected admin portal pages.</p>
          </div>

          {form.portalAccess ? (
            <>
              <div className="sm:col-span-2">
                <Label className="mb-1.5 block">HR data access</Label>
                <Select value={form.hrAccess} onChange={(e) => set("hrAccess", e.target.value as "self" | "manage")}>
                  <option value="self">Own employee data only</option>
                  <option value="manage">HR — all employees</option>
                </Select>
                <p className="mt-1 text-xs text-muted-foreground">Use “HR — all employees” only for HR managers. Sales executives and other staff should use own data only.</p>
              </div>
              <div className="sm:col-span-2">
                <Label className="mb-1.5 block">Portal password {!editing ? <RequiredMark /> : null}</Label>
                <Input
                  type="password"
                  value={form.portalPassword}
                  onChange={(e) => set("portalPassword", e.target.value)}
                  placeholder={editing ? "Leave blank to keep current password" : "Minimum 6 characters"}
                  minLength={form.portalPassword ? 6 : undefined}
                  required={!editing}
                />
              </div>
              <div className="sm:col-span-2">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <Label>Page access <RequiredMark /></Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => set("portalPages", suggestedEmployeePortalPages(form.designation) as AdminPortalPageKey[])}
                  >
                    Suggest from designation
                  </Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {ADMIN_PORTAL_PAGES.map((page) => (
                    <label key={page.key} className="flex items-center gap-2 rounded-md border border-border p-3 text-sm">
                      <input
                        type="checkbox"
                        checked={form.portalPages.includes(page.key)}
                        onChange={() => togglePage(page.key)}
                        className="size-4 rounded border-input"
                      />
                      {page.label}
                    </label>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Notes</Label>
            <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} className="min-h-24" />
          </div>
      </div>
      <div className="sticky bottom-0 z-10 -mx-5 -mb-5 flex flex-col-reverse gap-2 border-t border-border bg-background/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onCancel ?? (() => router.push("/admin/settings?section=employees"))}>Cancel</Button>
        <Button type="submit" variant="gradient" className="w-full sm:w-auto" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          {editing ? "Save employee" : "Add employee"}
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useBusinessBrand } from "@/components/business-brand";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PARTNER_TYPES } from "@/lib/constants";

const INITIAL_FORM = {
  name: "",
  email: "",
  mobile: "",
  password: "",
  businessName: "",
  partnerType: "Travel Agency",
  status: "approved",
  defaultCommission: 1000,
};

type InviteResult = {
  email: string;
  temporaryPassword: string;
  slug: string;
  status: string;
};

export function PartnerInviteDrawer() {
  const brand = useBusinessBrand();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InviteResult | null>(null);
  const [form, setForm] = useState(INITIAL_FORM);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetAndClose() {
    setOpen(false);
    setResult(null);
    setForm(INITIAL_FORM);
  }

  async function copyCredentials() {
    if (!result) return;
    const text = `${brand.name} partner login
Email: ${result.email}
Password: ${result.temporaryPassword}
Partner link: ${brand.siteUrl}/p/${result.slug}`;
    await navigator.clipboard.writeText(text);
    toast.success("Partner credentials copied");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          defaultCommission: Number(form.defaultCommission) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Invite failed");
      setResult(data.data);
      toast.success("Partner invited");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="gradient" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Invite Partner
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/35" onClick={resetAndClose}>
          <aside className="ml-auto flex h-full w-full max-w-xl flex-col bg-background shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-border p-5">
              <div>
                <h2 className="text-xl font-semibold">Invite Partner</h2>
                <p className="text-sm text-muted-foreground">Create a partner login from admin.</p>
              </div>
              <Button variant="ghost" size="icon" onClick={resetAndClose} aria-label="Close">
                <X className="size-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {result ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-success/30 bg-success/10 p-4">
                    <h3 className="font-semibold text-success">Partner account created</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Share these login details with the partner.</p>
                  </div>
                  <div className="space-y-3 rounded-xl border border-border p-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium">{result.email}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Temporary password</p>
                      <p className="font-mono font-semibold">{result.temporaryPassword}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Partner link namespace</p>
                      <p className="font-mono">/p/{result.slug}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-medium">{result.status}</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={copyCredentials}>
                      <Copy className="size-4" /> Copy details
                    </Button>
                    <Button type="button" variant="gradient" onClick={resetAndClose}>Done</Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Contact name">
                      <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
                    </Field>
                    <Field label="Business name">
                      <Input value={form.businessName} onChange={(e) => set("businessName", e.target.value)} required />
                    </Field>
                    <Field label="Email">
                      <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
                    </Field>
                    <Field label="Mobile">
                      <Input value={form.mobile} maxLength={10} onChange={(e) => set("mobile", e.target.value)} required />
                    </Field>
                    <Field label="Partner type">
                      <Select value={form.partnerType} onChange={(e) => set("partnerType", e.target.value)}>
                        {PARTNER_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                      </Select>
                    </Field>
                    <Field label="Status">
                      <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                      </Select>
                    </Field>
                    <Field label="Default commission">
                      <Input type="number" min={0} value={form.defaultCommission} onChange={(e) => set("defaultCommission", Number(e.target.value))} />
                    </Field>
                    <Field label="Temporary password">
                      <Input value={form.password} onChange={(e) => set("password", e.target.value)} required />
                    </Field>
                  </div>
                  <div className="rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
                    Partner self signup is disabled. Invited partners can log in using the email and temporary password created here.
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={resetAndClose}>Cancel</Button>
                    <Button type="submit" variant="gradient" disabled={loading}>
                      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                      Create invite
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label} <span className="text-destructive">*</span></Label>
      {children}
    </div>
  );
}

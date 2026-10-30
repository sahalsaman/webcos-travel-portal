"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { ErrorState, Loading, Status } from "@/components/admin-page-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SUBSCRIPTION_PLANS } from "@/lib/constants";

type Tenant = {
  _id: string;
  name: string;
  slug: string;
  hosts: string[];
  siteUrl: string;
  status: "active" | "suspended";
  primaryColor?: string;
  owner?: { name: string; email: string; phone?: string; countryCode?: string };
  currency?: string;
  subscription?: { plan: string; amount: number; setupFee?: number; setupPaidAmount?: number; startedAt?: string };
  createdAt?: string;
};

const inputClassName = "mt-1 w-full rounded-lg border bg-background p-2.5";
const date = (value?: string) => value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value)) : "—";
const dateInput = (value?: string) => value ? new Date(value).toISOString().slice(0, 10) : "";

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const text = await response.text();
  const body = text ? JSON.parse(text) : {};
  if (!response.ok || !body.success) throw new Error(body.message || "Request failed");
  return body.data;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);

  const load = async () => {
    try {
      setError("");
      setTenants(await request<Tenant[]>("/api/platform/businesses"));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load tenants");
    } finally {
      setLoaded(true);
    }
  };

  useEffect(() => { void load(); }, []);

  const invite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      await request("/api/platform/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))),
      });
      setInviteOpen(false);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to invite tenant");
    } finally {
      setBusy(false);
    }
  };

  const save = async (tenant: Tenant, event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      const adminPassword = String(form.get("adminPassword") || "");
      const tenantNewPassword = String(form.get("tenantNewPassword") || "");
      await request("/api/platform/businesses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: tenant._id,
          name: form.get("name"),
          slug: form.get("slug"),
          host: form.get("host"),
          siteUrl: form.get("siteUrl"),
          adminName: form.get("adminName"),
          adminEmail: form.get("adminEmail"),
          adminPhoneCountryCode: form.get("adminPhoneCountryCode"),
          adminPhone: form.get("adminPhone"),
          currency: form.get("currency"),
          primaryColor: form.get("primaryColor"),
          status: form.get("status"),
          subscription: {
            plan: form.get("plan"),
            setupFee: Number(form.get("setupFee") || 0),
            setupPaidAmount: Number(form.get("setupPaidAmount") || 0),
            startedAt: form.get("startedAt") || null,
          },
          ...(adminPassword || tenantNewPassword ? { adminPassword, tenantNewPassword } : {}),
        }),
      });
      setEditing(null);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update tenant");
    } finally {
      setBusy(false);
    }
  };

  if (!loaded) return <Loading />;

  return (
    <section>
      <header className="mb-6 flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-primary">Tenants</p>
          <h1 className="mt-1 text-3xl font-bold">Travels/Holidays agency tenants</h1>
          <p className="mt-2 text-sm text-muted-foreground">Manage agency portals, plans and owner access.</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}><Plus />Invite tenant</Button>
      </header>

      {error && <div className="mb-5"><ErrorState message={error} /></div>}

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-220 text-sm">
            <thead className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="p-4">Tenant business</th><th className="p-4">Portal host</th><th className="p-4">Package</th><th className="p-4">Status</th><th className="p-4">Created</th><th className="p-4 text-right">Action</th></tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant._id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-4"><p className="font-semibold">{tenant.name}</p><p className="text-xs text-muted-foreground">{tenant.slug}</p></td>
                  <td className="p-4 text-muted-foreground">{tenant.hosts.join(", ")}</td>
                  <td className="p-4"><p className="font-medium capitalize">{tenant.subscription?.plan || "Basic"}</p><p className="text-xs text-muted-foreground">₹{tenant.subscription?.amount || 0}/month</p></td>
                  <td className="p-4"><Status value={tenant.status} /></td>
                  <td className="p-4 text-muted-foreground">{date(tenant.createdAt)}</td>
                  <td className="p-4 text-right"><Button size="sm" variant="outline" onClick={() => setEditing(tenant)}><Pencil />Edit</Button></td>
                </tr>
              ))}
              {!tenants.length && <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">No tenants yet.</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {inviteOpen && (
        <Modal title="Invite a travel agency" close={() => setInviteOpen(false)}>
          <TenantForm mode="invite" busy={busy} onSubmit={invite} onCancel={() => setInviteOpen(false)} />
        </Modal>
      )}
      {editing && (
        <Modal title={`Edit ${editing.name}`} close={() => setEditing(null)}>
          <TenantForm mode="edit" tenant={editing} busy={busy} onSubmit={(event) => void save(editing, event)} onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </section>
  );
}

function TenantForm({ mode, tenant, busy, onSubmit, onCancel }: { mode: "invite" | "edit"; tenant?: Tenant; busy: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onCancel: () => void }) {
  const invite = mode === "invite";
  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <Field label="Agency name"><input required name="name" defaultValue={tenant?.name} className={inputClassName} /></Field>
      <Field label="Agency website"><input required name="siteUrl" type="url" defaultValue={tenant?.siteUrl} className={inputClassName} /></Field>

      <Field label="Tenant slug"><input required name="slug" defaultValue={tenant?.slug} className={inputClassName} /></Field>
      <Field label="Portal host"><input required name="host" defaultValue={tenant?.hosts[0]} placeholder="portal.example.com" className={inputClassName} /></Field>
      <Field label="Tenant owner"><input required name="adminName" defaultValue={tenant?.owner?.name} className={inputClassName} /></Field>
      <Field label="Owner email"><input required name="adminEmail" type="email" defaultValue={tenant?.owner?.email} className={inputClassName} /></Field>
      <Field label="Owner country code"><select name="adminPhoneCountryCode" defaultValue={tenant?.owner?.countryCode || "+91"} className={inputClassName}><option value="+91">+91 India</option><option value="+1">+1 USA / Canada</option><option value="+44">+44 United Kingdom</option><option value="+971">+971 UAE</option></select></Field>
      <Field label="Owner phone"><input required name="adminPhone" type="tel" defaultValue={tenant?.owner?.phone} className={inputClassName} /></Field>
      {invite && <>
        <Field label="Temporary password"><input required name="adminPassword" type="password" minLength={12} className={inputClassName} /></Field>
      </>}
      <Field label="Subscription plan"><select name="plan" defaultValue={tenant?.subscription?.plan || "basic"} className={inputClassName}>{SUBSCRIPTION_PLANS.map((plan) => <option key={plan.plan} value={plan.plan}>{plan.label} — ₹{plan.price}/month</option>)}</select></Field>
      <Field label="Business currency"><select name="currency" defaultValue={tenant?.currency || "INR"} className={inputClassName}><option value="INR">INR — Indian Rupee</option><option value="USD">USD — US Dollar</option><option value="AED">AED — UAE Dirham</option><option value="EUR">EUR — Euro</option><option value="GBP">GBP — Pound Sterling</option></select></Field>
      <Field label="Setup amount"><input name="setupFee" type="number" min="0" defaultValue={tenant?.subscription?.setupFee ?? SUBSCRIPTION_PLANS[0].setupFee} className={inputClassName} /></Field>
      <Field label="Setup amount paid"><input name="setupPaidAmount" type="number" min="0" defaultValue={tenant?.subscription?.setupPaidAmount ?? 0} className={inputClassName} /></Field>
      {!invite && <Field label="Subscription starts on"><input name="startedAt" type="date" defaultValue={dateInput(tenant?.subscription?.startedAt)} className={inputClassName} /></Field>}
      <Field label="Brand colour"><input name="primaryColor" type="color" defaultValue={tenant?.primaryColor || "#0060e6"} className="mt-1 block h-11 w-full rounded-lg border bg-background p-1" /></Field>

      {!invite && <>
        <Field label="Portal status"><select name="status" defaultValue={tenant?.status} className={inputClassName}><option value="active">Active</option><option value="suspended">Suspended</option></select></Field>
        <div className="sm:col-span-2 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
          <p className="font-semibold text-amber-950">Reset tenant owner password</p>
          <p className="mt-1 text-xs text-amber-900">Enter both fields only when resetting access. There is no temporary password field when editing.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input name="adminPassword" type="password" placeholder="Your admin password" className="rounded-lg border bg-background p-2.5" />
            <input name="tenantNewPassword" type="password" minLength={12} placeholder="Tenant new password" className="rounded-lg border bg-background p-2.5" />
          </div>
        </div>
      </>}

      <div className="flex justify-end gap-2 sm:col-span-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button disabled={busy}>{busy ? (invite ? "Creating…" : "Saving…") : (invite ? "Create tenant" : "Save changes")}</Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block text-sm font-medium"><span className="block">{label}</span>{children}</label>;
}

function Modal({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <Card className="max-h-[92vh] w-full max-w-2xl overflow-y-auto shadow-2xl">
        <CardHeader className="flex-row items-start justify-between"><CardTitle>{title}</CardTitle><Button type="button" variant="ghost" size="icon" onClick={close} aria-label="Close dialog"><X /></Button></CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}

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
import { COUNTRY_OPTIONS, SUPPLIER_STATUSES, SUPPLIER_TYPES } from "@/lib/constants";
import type { SupplierDTO } from "@/types";

function countryValue(country: string, countryCode: string) {
  return `${countryCode}|${country}`;
}

export function SupplierForm({
  supplier,
  onSaved,
  onCancel,
  defaultType,
}: {
  supplier?: SupplierDTO;
  onSaved?: () => void;
  onCancel?: () => void;
  defaultType?: SupplierDTO["type"];
}) {
  const router = useRouter();
  const editing = Boolean(supplier);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    companyName: supplier?.companyName ?? "",
    contactName: supplier?.contactName ?? "",
    email: supplier?.email ?? "",
    phone: supplier?.phone ?? "",
    type: supplier?.type ?? defaultType ?? SUPPLIER_TYPES[0],
    status: supplier?.status ?? "active",
    country: supplier?.country ?? "India",
    countryCode: supplier?.countryCode ?? "IN",
    city: supplier?.city ?? "",
    address: supplier?.address ?? "",
    taxId: supplier?.taxId ?? "",
    commissionRate: supplier?.commissionRate ?? 0,
    notes: supplier?.notes ?? "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function onCountryChange(value: string) {
    const [countryCode, country] = value.split("|");
    setForm((current) => ({ ...current, countryCode, country }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(editing ? `/api/admin/suppliers/${supplier!._id}` : "/api/admin/suppliers", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, commissionRate: Number(form.commissionRate) }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to save supplier");
      toast.success(editing ? "Supplier updated" : "Supplier created");
      router.refresh();
      if (onSaved) onSaved();
      else router.push("/admin/users/suppliers");
    } catch (error) {
      toast.error((error as Error).message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid items-start gap-x-4 gap-y-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Company name <span className="text-destructive">*</span></Label>
            <Input value={form.companyName} onChange={(event) => set("companyName", event.target.value)} required />
          </div>
          <div>
            <Label className="mb-1.5 block">Contact person</Label>
            <Input value={form.contactName} onChange={(event) => set("contactName", event.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block">Supplier type <span className="text-destructive">*</span></Label>
            <Select value={form.type} onChange={(event) => set("type", event.target.value as typeof form.type)}>
              {SUPPLIER_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">Email</Label>
            <Input type="email" value={form.email} onChange={(event) => set("email", event.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block">Phone <span className="text-destructive">*</span></Label>
            <Input value={form.phone} onChange={(event) => set("phone", event.target.value)} required />
          </div>
          <div>
            <Label className="mb-1.5 block">Country <span className="text-destructive">*</span></Label>
            <Select value={countryValue(form.country, form.countryCode)} onChange={(event) => onCountryChange(event.target.value)}>
              {COUNTRY_OPTIONS.map((country) => (
                <option key={country.code} value={countryValue(country.name, country.code)}>{country.name} ({country.code})</option>
              ))}
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">City</Label>
            <Input value={form.city} onChange={(event) => set("city", event.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block">Tax/GST ID</Label>
            <Input value={form.taxId} onChange={(event) => set("taxId", event.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block">Status</Label>
            <Select value={form.status} onChange={(event) => set("status", event.target.value as typeof form.status)}>
              {SUPPLIER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">Commission rate (%)</Label>
            <Input type="number" min={0} max={100} step="0.01" value={form.commissionRate} onChange={(event) => set("commissionRate", Number(event.target.value))} />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Address</Label>
            <Textarea value={form.address} onChange={(event) => set("address", event.target.value)} className="min-h-20" />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Notes</Label>
            <Textarea value={form.notes} onChange={(event) => set("notes", event.target.value)} className="min-h-24" />
          </div>
      </div>
      <div className="sticky bottom-0 z-10 -mx-5 -mb-5 flex flex-col-reverse gap-2 border-t border-border bg-background/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onCancel ?? (() => router.push("/admin/users/suppliers"))}>Cancel</Button>
        <Button type="submit" variant="gradient" className="w-full sm:w-auto" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          {editing ? "Save supplier" : "Create supplier"}
        </Button>
      </div>
    </form>
  );
}

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
import { COUNTRY_OPTIONS, DESTINATION_STATUSES } from "@/lib/constants";
import type { DestinationDTO } from "@/types";

function countryValue(country: string, countryCode: string) {
  return `${countryCode}|${country}`;
}

export function DestinationForm({ destination, onSaved, onCancel }: { destination?: DestinationDTO; onSaved?: () => void; onCancel?: () => void }) {
  const router = useRouter();
  const editing = Boolean(destination);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: destination?.title ?? "",
    description: destination?.description ?? "",
    basePrice: destination?.basePrice ?? 0,
    status: destination?.status ?? "active",
    featured: destination?.featured ?? false,
    popular: destination?.popular ?? false,
    country: destination?.country ?? "India",
    countryCode: destination?.countryCode ?? "IN",
    images: (destination?.images ?? []).join("\n"),
    tags: (destination?.tags ?? []).join(", "),
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function onCountryChange(value: string) {
    const [code, name] = value.split("|");
    setForm((current) => ({ ...current, countryCode: code, country: name }));
  }

  function lines(value: string) {
    return value.split("\n").map((x) => x.trim()).filter(Boolean);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const payload = {
      title: form.title,
      description: form.description,
      basePrice: Number(form.basePrice) || 0,
      status: form.status,
      featured: form.featured,
      popular: form.popular,
      country: form.country,
      countryCode: form.countryCode,
      images: lines(form.images),
      tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    };

    try {
      const res = await fetch(editing ? `/api/admin/destinations/${destination!._id}` : "/api/admin/destinations", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Save failed");
      toast.success(editing ? "Destination updated" : "Destination created");
      if (onSaved) onSaved();
      else router.push("/admin/inventory/destinations");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid items-start gap-x-4 gap-y-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Destination name <span className="text-destructive">*</span></Label>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} required />
          </div>
          <div>
            <Label className="mb-1.5 block">Country</Label>
            <Select value={countryValue(form.country, form.countryCode)} onChange={(e) => onCountryChange(e.target.value)}>
              {COUNTRY_OPTIONS.map((country) => (
                <option key={country.code} value={countryValue(country.name, country.code)}>
                  {country.name} ({country.code})
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">Base price</Label>
            <Input type="number" min={0} value={form.basePrice} onChange={(e) => set("basePrice", Number(e.target.value))} />
          </div>
          <div>
            <Label className="mb-1.5 block">Status</Label>
            <Select value={form.status} onChange={(e) => set("status", e.target.value as typeof form.status)}>
              {DESTINATION_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </Select>
          </div>
          <div className="flex items-end gap-5">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} className="size-4 accent-[var(--primary)]" />
              Highlight
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={form.popular} onChange={(e) => set("popular", e.target.checked)} className="size-4 accent-[var(--primary)]" />
              Popular
            </label>
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Description</Label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} className="min-h-24" />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Image URLs (one per line)</Label>
            <Textarea value={form.images} onChange={(e) => set("images", e.target.value)} className="min-h-24 font-mono text-xs" />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Tags (comma separated)</Label>
            <Input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="beach, family, luxury" />
          </div>
      </div>
      <div className="sticky bottom-0 z-10 -mx-5 -mb-5 flex flex-col-reverse gap-2 border-t border-border bg-background/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onCancel ?? (() => router.push("/admin/inventory/destinations"))}>Cancel</Button>
        <Button type="submit" variant="gradient" className="w-full sm:w-auto" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          {editing ? "Save destination" : "Create destination"}
        </Button>
      </div>
    </form>
  );
}

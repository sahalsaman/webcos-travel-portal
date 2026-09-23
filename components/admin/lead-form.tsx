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
import { LEAD_SOURCES, LEAD_STATUSES } from "@/lib/constants";
import type { CampaignDTO, LeadDTO } from "@/types";

const Mark = () => <span className="text-destructive">*</span>;
const refId = (value: LeadDTO["campaign"]) => typeof value === "string" ? value : value?._id ?? "";

export function LeadForm({ lead, campaigns, defaultCampaignId, onDone }: { lead?: LeadDTO; campaigns: CampaignDTO[]; defaultCampaignId?: string; onDone: () => void }) {
  const router = useRouter(); const [loading, setLoading] = useState(false);
  const initialCampaign = refId(lead?.campaign) || defaultCampaignId || "";
  const [form, setForm] = useState({ customerName: lead?.customerName ?? "", email: lead?.email ?? "", phone: lead?.phone ?? "", destination: lead?.destination ?? "", travelDate: lead?.travelDate?.slice(0, 10) ?? "", travelers: lead?.travelers ?? 1, budget: lead?.budget ?? 0, source: lead?.source ?? (initialCampaign ? "Marketing Campaign" : "Website"), status: lead?.status ?? "new", campaignId: initialCampaign, assignedTo: lead?.assignedTo ?? "", notes: lead?.notes ?? "" });
  const set = (key: keyof typeof form, value: string | number) => setForm((current) => ({ ...current, [key]: value }));
  async function submit(event: React.FormEvent) { event.preventDefault(); setLoading(true); try { const response = await fetch(lead ? `/api/admin/leads/${lead._id}` : "/api/admin/leads", { method: lead ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, travelers: Number(form.travelers), budget: Number(form.budget), campaignId: form.source === "Marketing Campaign" ? form.campaignId : "" }) }); const data = await response.json(); if (!response.ok || !data.success) throw new Error(data.message || "Unable to save lead"); toast.success(lead ? "Lead updated" : "Lead created"); router.refresh(); onDone(); } catch (error) { toast.error((error as Error).message); setLoading(false); } }
  return <form onSubmit={submit} className="space-y-5"><div className="grid gap-4 sm:grid-cols-2">
    <div className="sm:col-span-2"><Label className="mb-1.5 block">Customer name <Mark /></Label><Input required value={form.customerName} onChange={(e) => set("customerName", e.target.value)} /></div>
    <div><Label className="mb-1.5 block">Phone <Mark /></Label><Input required value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div><div><Label className="mb-1.5 block">Email</Label><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
    <div><Label className="mb-1.5 block">Source <Mark /></Label><Select value={form.source} onChange={(e) => set("source", e.target.value)}>{LEAD_SOURCES.map((item) => <option key={item}>{item}</option>)}</Select></div><div><Label className="mb-1.5 block">Status <Mark /></Label><Select value={form.status} onChange={(e) => set("status", e.target.value)}>{LEAD_STATUSES.map((item) => <option key={item}>{item}</option>)}</Select></div>
    {form.source === "Marketing Campaign" ? <div className="sm:col-span-2"><Label className="mb-1.5 block">Marketing campaign <Mark /></Label><Select required value={form.campaignId} onChange={(e) => set("campaignId", e.target.value)}><option value="">Select campaign</option>{campaigns.map((campaign) => <option key={campaign._id} value={campaign._id}>{campaign.name} — {campaign.channel}</option>)}</Select></div> : null}
    <div><Label className="mb-1.5 block">Destination</Label><Input value={form.destination} onChange={(e) => set("destination", e.target.value)} /></div><div><Label className="mb-1.5 block">Travel date</Label><Input type="date" value={form.travelDate} onChange={(e) => set("travelDate", e.target.value)} /></div>
    <div><Label className="mb-1.5 block">Travelers <Mark /></Label><Input required type="number" min={1} value={form.travelers} onChange={(e) => set("travelers", Number(e.target.value))} /></div><div><Label className="mb-1.5 block">Budget</Label><Input type="number" min={0} value={form.budget} onChange={(e) => set("budget", Number(e.target.value))} /></div>
    <div className="sm:col-span-2"><Label className="mb-1.5 block">Assigned to</Label><Input value={form.assignedTo} onChange={(e) => set("assignedTo", e.target.value)} /></div><div className="sm:col-span-2"><Label className="mb-1.5 block">Notes</Label><Textarea className="min-h-24" value={form.notes} onChange={(e) => set("notes", e.target.value)} /></div>
  </div><div className="flex justify-end gap-2 border-t border-border pt-4"><Button type="button" variant="outline" onClick={onDone}>Cancel</Button><Button type="submit" variant="gradient" disabled={loading}>{loading ? <Loader2 className="size-4 animate-spin" /> : null}Save Lead</Button></div></form>;
}

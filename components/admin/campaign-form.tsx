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
import { CAMPAIGN_CHANNELS, CAMPAIGN_STATUSES } from "@/lib/constants";
import type { CampaignDTO } from "@/types";

function dateInput(value?: string | null) {
  return value ? value.slice(0, 10) : "";
}

export function CampaignForm({ campaign, onSaved, onCancel }: { campaign?: CampaignDTO; onSaved: () => void; onCancel: () => void }) {
  const router = useRouter();
  const editing = Boolean(campaign);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: campaign?.name ?? "",
    channel: campaign?.channel ?? CAMPAIGN_CHANNELS[0],
    status: campaign?.status ?? "draft",
    targetAudience: campaign?.targetAudience ?? "",
    budget: campaign?.budget ?? 0,
    spent: campaign?.spent ?? 0,
    startDate: dateInput(campaign?.startDate),
    endDate: dateInput(campaign?.endDate),
    owner: campaign?.owner ?? "",
    description: campaign?.description ?? "",
    notes: campaign?.notes ?? "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(editing ? `/api/admin/campaigns/${campaign!._id}` : "/api/admin/campaigns", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, budget: Number(form.budget), spent: Number(form.spent) }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to save campaign");
      toast.success(editing ? "Campaign updated" : "Campaign created");
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
            <Label className="mb-1.5 block">Campaign name <span className="text-destructive">*</span></Label>
            <Input value={form.name} onChange={(event) => set("name", event.target.value)} required />
          </div>
          <div>
            <Label className="mb-1.5 block">Channel <span className="text-destructive">*</span></Label>
            <Select value={form.channel} onChange={(event) => set("channel", event.target.value as typeof form.channel)}>
              {CAMPAIGN_CHANNELS.map((channel) => <option key={channel} value={channel}>{channel}</option>)}
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">Status</Label>
            <Select value={form.status} onChange={(event) => set("status", event.target.value as typeof form.status)}>
              {CAMPAIGN_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Target audience <span className="text-destructive">*</span></Label>
            <Input value={form.targetAudience} onChange={(event) => set("targetAudience", event.target.value)} placeholder="Families in Kerala, previous travelers..." required />
          </div>
          <div>
            <Label className="mb-1.5 block">Budget <span className="text-destructive">*</span></Label>
            <Input type="number" min={0} step="0.01" value={form.budget} onChange={(event) => set("budget", Number(event.target.value))} required />
          </div>
          <div>
            <Label className="mb-1.5 block">Amount spent</Label>
            <Input type="number" min={0} step="0.01" value={form.spent} onChange={(event) => set("spent", Number(event.target.value))} />
          </div>
          <div>
            <Label className="mb-1.5 block">Start date <span className="text-destructive">*</span></Label>
            <Input type="date" value={form.startDate} onChange={(event) => set("startDate", event.target.value)} required />
          </div>
          <div>
            <Label className="mb-1.5 block">End date</Label>
            <Input type="date" min={form.startDate || undefined} value={form.endDate} onChange={(event) => set("endDate", event.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Owner</Label>
            <Input value={form.owner} onChange={(event) => set("owner", event.target.value)} placeholder="Marketing team or employee name" />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Description</Label>
            <Textarea value={form.description} onChange={(event) => set("description", event.target.value)} className="min-h-24" />
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Notes</Label>
            <Textarea value={form.notes} onChange={(event) => set("notes", event.target.value)} className="min-h-20" />
          </div>
      </div>
      <div className="sticky bottom-0 z-10 -mx-5 -mb-5 flex flex-col-reverse gap-2 border-t border-border bg-background/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="gradient" className="w-full sm:w-auto" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          {editing ? "Save campaign" : "Create campaign"}
        </Button>
      </div>
    </form>
  );
}

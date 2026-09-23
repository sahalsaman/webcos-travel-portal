"use client";

import { useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeadForm } from "@/components/admin/lead-form";
import type { CampaignDTO, LeadDTO } from "@/types";

export function LeadDrawer({ lead, campaigns, defaultCampaignId }: { lead?: LeadDTO; campaigns: CampaignDTO[]; defaultCampaignId?: string }) {
  const [open, setOpen] = useState(false);
  return <>{lead ? <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label={`Edit ${lead.leadNumber}`}><Pencil className="size-4" /></Button> : <Button type="button" variant="gradient" onClick={() => setOpen(true)}><Plus className="size-4" />Add Lead</Button>}
    {open ? <div className="fixed inset-0 z-[80]"><button type="button" className="absolute inset-0 bg-black/45" onClick={() => setOpen(false)} aria-label="Close lead form" /><aside role="dialog" aria-modal="true" className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col border-l border-border bg-background shadow-2xl"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="text-lg font-bold text-left">{lead ? "Edit Lead" : "Add Lead"}</h2><p className="text-sm text-muted-foreground">{lead?.leadNumber ?? "Record a customer enquiry"}</p></div><Button variant="ghost" size="icon" onClick={() => setOpen(false)}><X className="size-5" /></Button></div><div className="min-h-0 flex-1 overflow-y-auto p-5"><LeadForm lead={lead} campaigns={campaigns} defaultCampaignId={defaultCampaignId} onDone={() => setOpen(false)} /></div></aside></div> : null}</>;
}

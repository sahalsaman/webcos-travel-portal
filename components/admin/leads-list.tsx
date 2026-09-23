"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Filter, RotateCcw, Search, UserRoundSearch } from "lucide-react";
import { LeadDrawer } from "@/components/admin/lead-drawer";
import { QuotationDrawer } from "@/components/admin/quotation-drawer";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn, formatDate, formatINR } from "@/lib/utils";
import type { CampaignDTO, LeadDTO } from "@/types";

const sourceOptions = ["Website", "Marketing Campaign", "WhatsApp", "Phone", "Walk-in"] as const;
const statuses = ["new", "contacted", "qualified", "quoted", "won", "lost"] as const;

const statusStyles: Record<(typeof statuses)[number], string> = {
  new: "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200",
  contacted: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100",
  qualified: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100",
  quoted: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-100",
  won: "border-green-200 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-100",
  lost: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-200",
};

export function LeadsList({ leads, campaigns, defaultCampaignId }: { leads: LeadDTO[]; campaigns: CampaignDTO[]; defaultCampaignId?: string }) {
  const [source, setSource] = useState("all");
  const [search, setSearch] = useState("");
  const [visibleStatuses, setVisibleStatuses] = useState<Set<string>>(() => new Set(statuses));
  const filteredLeads = useMemo(() => leads.filter((lead) => {
    if (source !== "all" && lead.source !== source) return false;
    if (!visibleStatuses.has(lead.status)) return false;
    const campaign=lead.campaign&&typeof lead.campaign==="object"?lead.campaign.name:"";
    const quotation=lead.quotation&&typeof lead.quotation==="object"?lead.quotation.quotationNumber:"";
    return !search.trim()||`${lead.leadNumber} ${lead.customerName} ${lead.email||""} ${lead.phone} ${lead.destination} ${lead.source} ${lead.assignedTo} ${campaign} ${quotation}`.toLowerCase().includes(search.trim().toLowerCase());
  }), [leads, search, source, visibleStatuses]);
  const changed = Boolean(search.trim()) || source !== "all" || visibleStatuses.size !== statuses.length;

  function toggleStatus(status: string) {
    setVisibleStatuses((current) => {
      const next = new Set(current);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  }

  function resetFilters() {
    setSource("all");
    setSearch("");
    setVisibleStatuses(new Set(statuses));
  }

  return <>
    <Card className="overflow-hidden">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex items-center gap-2 text-sm font-semibold"><Filter className="size-4 text-primary" />Filters</div>
          <div className="relative w-full lg:max-w-sm"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input value={search} onChange={(event)=>setSearch(event.target.value)} placeholder="Search lead, customer, contact or destination..." className="pl-9" aria-label="Search leads"/></div>
          <div className="w-full lg:w-72">
            <Select value={source} onChange={(event) => setSource(event.target.value)} aria-label="Filter leads by source">
              <option value="all">All sources</option>
              {sourceOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
          </div>
          <p className="text-sm text-muted-foreground lg:ml-auto">Showing {filteredLeads.length} of {leads.length} leads</p>
          {changed ? <Button type="button" variant="ghost" size="sm" onClick={resetFilters}><RotateCcw className="size-4" />Reset</Button> : null}
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Filter leads by status">
          {statuses.map((status) => (
            <label key={status} className={cn("inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium capitalize transition-opacity", statusStyles[status], !visibleStatuses.has(status) && "opacity-40 grayscale")}>
              <input type="checkbox" checked={visibleStatuses.has(status)} onChange={() => toggleStatus(status)} className="size-4 cursor-pointer accent-current" />
              {status}
            </label>
          ))}
        </div>
      </CardContent>
    </Card>

    {filteredLeads.length ? <Card><CardContent className="overflow-x-auto p-0"><table className="w-full text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-4">Lead</th><th className="p-4">Customer</th><th className="p-4">Trip interest</th><th className="p-4">Source</th><th className="p-4">Status</th><th className="p-4">Quotation</th><th className="p-4 text-right">Action</th></tr></thead><tbody>{filteredLeads.map((lead) => { const sourceCampaign = typeof lead.campaign === "object" ? lead.campaign : null; const quotation = typeof lead.quotation === "object" ? lead.quotation : null; return <tr key={lead._id} className="border-b border-border/50 align-top hover:bg-secondary/40"><td className="p-4"><p className="font-mono text-xs">{lead.leadNumber}</p><p className="text-xs text-muted-foreground">{formatDate(lead.createdAt)}</p></td><td className="p-4"><p className="font-medium">{lead.customerName}</p><p className="text-xs text-muted-foreground">{lead.phone}{lead.email ? ` · ${lead.email}` : ""}</p></td><td className="p-4"><p>{lead.destination || "Not specified"}</p><p className="text-xs text-muted-foreground">{lead.travelers} traveler(s){lead.budget ? ` · ${formatINR(lead.budget)}` : ""}</p></td><td className="p-4"><p>{lead.source}</p>{sourceCampaign ? <Link className="text-xs text-primary hover:underline" href="/admin/campaigns">{sourceCampaign.name}</Link> : null}</td><td className="p-4"><StatusBadge status={lead.status} /></td><td className="p-4">{quotation ? <Link href="/admin/lms/quotations" className="font-mono text-xs text-primary hover:underline">{quotation.quotationNumber}</Link> : <QuotationDrawer leads={leads} leadId={lead._id} />}</td><td className="p-4 text-right"><LeadDrawer lead={lead} campaigns={campaigns} /></td></tr>; })}</tbody></table></CardContent></Card> : <EmptyState icon={UserRoundSearch} title={changed ? "No matching leads" : "No leads yet"} description={changed ? "Try another source or enable more lead statuses." : "Add a lead manually or attribute one to a marketing campaign."} action={changed ? <Button type="button" variant="outline" onClick={resetFilters}>Reset filters</Button> : <LeadDrawer campaigns={campaigns} defaultCampaignId={defaultCampaignId} />} />}
  </>;
}

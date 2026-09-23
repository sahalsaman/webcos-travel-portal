"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuotationForm } from "@/components/admin/quotation-form";
import type { LeadDTO, QuotationDTO, TripDTO, UserDTO } from "@/types";

export function QuotationDrawer({ quotation, leads = [], customers = [], itineraries = [], leadId, customer }: { quotation?: QuotationDTO; leads?: LeadDTO[]; customers?: UserDTO[]; itineraries?: TripDTO[]; leadId?: string; customer?: UserDTO }) {
  const [open, setOpen] = useState(false);
  const [availableItineraries, setAvailableItineraries] = useState(itineraries);
  const editing = Boolean(quotation);
  useEffect(() => { if (!open || availableItineraries.length) return; fetch("/api/packages").then((response) => response.json()).then((data) => setAvailableItineraries(data.data ?? [])).catch(() => undefined); }, [open, availableItineraries.length]);
  return (
    <>
      {editing ? (
        <Button type="button" variant="ghost" size="icon" aria-label={`Edit ${quotation!.quotationNumber}`} onClick={() => setOpen(true)}><Pencil className="size-4" /></Button>
      ) : (
        <Button type="button" variant={customer ? "outline" : "gradient"} size={customer ? "sm" : "default"} onClick={() => setOpen(true)}><Plus className="size-4" /> {customer ? "Create Quotation" : "New Quotation"}</Button>
      )}
      {open ? (
        <div className="fixed inset-0 z-[80]">
          <button type="button" className="absolute inset-0 bg-black/45" onClick={() => setOpen(false)} aria-label="Close quotation form" />
          <aside role="dialog" aria-modal="true" aria-labelledby="quotation-drawer-title" className="absolute right-0 top-0 flex h-full w-full max-w-3xl flex-col border-l border-border bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="min-w-0 pr-3"><h2 id="quotation-drawer-title" className="text-lg font-bold">{editing ? "Edit Quotation" : "New Quotation"}</h2><p className="truncate text-sm text-muted-foreground">{editing ? quotation!.quotationNumber : "Create a special quotation for a customer"}</p></div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close"><X className="size-5" /></Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5"><QuotationForm quotation={quotation} leads={leads} customers={customers} itineraries={availableItineraries} defaultLeadId={leadId} defaultCustomer={customer} onSaved={() => setOpen(false)} onCancel={() => setOpen(false)} /></div>
          </aside>
        </div>
      ) : null}
    </>
  );
}

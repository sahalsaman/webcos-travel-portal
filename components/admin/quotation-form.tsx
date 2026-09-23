"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { QUOTATION_STATUSES } from "@/lib/constants";
import { calculateQuotation } from "@/lib/quotation";
import { formatINR } from "@/lib/utils";
import type { LeadDTO, QuotationDTO, TripDTO, UserDTO } from "@/types";

function defaultValidity() {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date.toISOString().slice(0, 10);
}

function referenceId(value: QuotationDTO["lead"]) { return typeof value === "string" ? value : value?._id ?? ""; }
function customerReferenceId(value: QuotationDTO["customer"]) { return typeof value === "string" ? value : value?._id ?? ""; }
function tripReferenceId(value: QuotationDTO["trip"]) { return typeof value === "string" ? value : value?._id ?? ""; }

export function QuotationForm({ quotation, leads = [], customers = [], itineraries = [], defaultLeadId, defaultCustomer, onSaved, onCancel }: { quotation?: QuotationDTO; leads?: LeadDTO[]; customers?: UserDTO[]; itineraries?: TripDTO[]; defaultLeadId?: string; defaultCustomer?: UserDTO; onSaved: () => void; onCancel: () => void }) {
  const router = useRouter();
  const editing = Boolean(quotation);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    leadId: referenceId(quotation?.lead) || defaultLeadId || "",
    customerId: customerReferenceId(quotation?.customer) || defaultCustomer?._id || "",
    customerName: quotation?.customerName ?? defaultCustomer?.name ?? "",
    customerEmail: quotation?.customerEmail ?? defaultCustomer?.email ?? "",
    customerPhone: quotation?.customerPhone ?? defaultCustomer?.mobile ?? "",
    itineraryId: tripReferenceId(quotation?.trip),
    itineraryTitle: quotation?.title ?? "",
    customItinerary: quotation?.customItinerary ?? [],
    amount: quotation?.subtotal ?? 0,
    discount: quotation?.discount ?? 0,
    taxRate: quotation?.taxRate ?? 0,
    validUntil: quotation?.validUntil.slice(0, 10) ?? defaultValidity(),
    status: quotation?.status ?? "draft",
    notes: quotation?.notes ?? "",
    terms: quotation?.terms ?? "",
    policy: quotation?.policy ?? "",
    importantInformation: quotation?.importantInformation ?? "",
    otherInformation: quotation?.otherInformation ?? "",
  });
  const totals = calculateQuotation([{ description: form.itineraryTitle || "Travel itinerary", quantity: 1, unitPrice: Number(form.amount) }], Number(form.discount), Number(form.taxRate));

  useEffect(() => {
    if (editing) return;
    let active = true;
    fetch("/api/admin/settings")
      .then((response) => response.json())
      .then((result) => {
        if (!active || !result.success) return;
        const settings = result.data;
        setForm((current) => ({
          ...current,
          terms: current.terms || settings.quotationTerms || "",
          policy: current.policy || settings.quotationPolicy || "",
          importantInformation: current.importantInformation || settings.quotationImportantInformation || "",
          otherInformation: current.otherInformation || settings.quotationOtherInformation || "",
        }));
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [editing]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function selectItinerary(itineraryId: string) { const itinerary = itineraries.find((item) => item._id === itineraryId); setForm((current) => ({ ...current, itineraryId, itineraryTitle: itinerary?.title ?? "", customItinerary: itinerary?.itinerary.map((item) => ({ ...item })) ?? [], amount: itinerary?.basePrice ?? 0 })); }
  function setItineraryDay(index: number, key: "title" | "description", value: string) { setForm((current) => ({ ...current, customItinerary: current.customItinerary.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item) })); }

  function selectLead(leadId: string) {
    const lead = leads.find((item) => item._id === leadId);
    setForm((current) => ({ ...current, leadId, customerId: leadId ? "" : current.customerId, customerName: lead?.customerName ?? current.customerName, customerEmail: lead?.email ?? current.customerEmail, customerPhone: lead?.phone ?? current.customerPhone, itineraryTitle: !current.itineraryTitle && lead?.destination ? `${lead.destination} travel quotation` : current.itineraryTitle }));
  }

  function selectCustomer(customerId: string) {
    const customer = customers.find((item) => item._id === customerId);
    setForm((current) => ({ ...current, customerId, leadId: customerId ? "" : current.leadId, customerName: customer?.name ?? current.customerName, customerEmail: customer?.email ?? current.customerEmail, customerPhone: customer?.mobile ?? current.customerPhone }));
  }

  function removeDay(index: number) { set("customItinerary", form.customItinerary.filter((_, itemIndex) => itemIndex !== index).map((item, itemIndex) => ({ ...item, day: itemIndex + 1 }))); }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(editing ? `/api/admin/quotations/${quotation!._id}` : "/api/admin/quotations", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          title: form.itineraryTitle,
          items: [{ description: form.itineraryTitle, quantity: 1, unitPrice: Number(form.amount) }],
          discount: Number(form.discount),
          taxRate: Number(form.taxRate),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to save quotation");
      toast.success(editing ? "Quotation updated" : "Quotation created");
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
        <div className="sm:col-span-2"><Label className="mb-1.5 block">Existing customer <span className="text-destructive">*</span></Label><Select required={!form.leadId} value={form.customerId} onChange={(event) => selectCustomer(event.target.value)}><option value="">Select customer</option>{customers.map((customer) => <option key={customer._id} value={customer._id}>{customer.name} — {customer.mobile || customer.email}</option>)}</Select></div>
        <div className="sm:col-span-2"><Label className="mb-1.5 block">Or linked lead <span className="text-destructive">*</span></Label><Select required={!form.customerId} value={form.leadId} onChange={(event) => selectLead(event.target.value)}><option value="">Select lead</option>{leads.map((lead) => <option key={lead._id} value={lead._id}>{lead.leadNumber} — {lead.customerName}{lead.destination ? ` · ${lead.destination}` : ""}</option>)}</Select></div>
        <div className="sm:col-span-2"><Label className="mb-1.5 block">Itinerary <span className="text-destructive">*</span></Label><Select required value={form.itineraryId} onChange={(event) => selectItinerary(event.target.value)}><option value="">Select itinerary</option>{itineraries.map((item) => <option key={item._id} value={item._id}>{item.title} — {item.destination}</option>)}</Select></div>
        <div className="sm:col-span-2"><Label className="mb-1.5 block">Quotation amount <span className="text-destructive">*</span></Label><Input type="number" min={0} step="0.01" required value={form.amount} onChange={(event) => set("amount", Number(event.target.value))} /></div>
        <div className="space-y-3 sm:col-span-2"><div className="flex items-center justify-between"><div><Label>Customer itinerary</Label><p className="text-xs text-muted-foreground">This copy belongs only to this quotation and does not change Inventory.</p></div><Button type="button" variant="outline" size="sm" onClick={() => set("customItinerary", [...form.customItinerary, { day: form.customItinerary.length + 1, title: "", description: "" }])}><Plus className="size-4" />Add day</Button></div><div className="space-y-3">{form.customItinerary.map((item, index) => <div key={index} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[70px_minmax(0,1fr)_40px]"><div><Label className="mb-1.5 block text-xs">Day</Label><Input value={item.day} readOnly /></div><div className="space-y-2"><Input required value={item.title} onChange={(event) => setItineraryDay(index, "title", event.target.value)} placeholder="Day title" /><Textarea value={item.description} onChange={(event) => setItineraryDay(index, "description", event.target.value)} placeholder="Customer-specific plan" /></div><Button type="button" variant="ghost" size="icon" aria-label="Remove day" onClick={() => removeDay(index)}><Trash2 className="size-4 text-destructive" /></Button></div>)}</div></div>

        <div><Label className="mb-1.5 block">Discount</Label><Input type="number" min={0} step="0.01" value={form.discount} onChange={(event) => set("discount", Number(event.target.value))} /></div>
        <div><Label className="mb-1.5 block">Tax rate (%)</Label><Input type="number" min={0} max={100} step="0.01" value={form.taxRate} onChange={(event) => set("taxRate", Number(event.target.value))} /></div>
        <div><Label className="mb-1.5 block">Valid until <span className="text-destructive">*</span></Label><Input type="date" value={form.validUntil} onChange={(event) => set("validUntil", event.target.value)} required /></div>
        <div><Label className="mb-1.5 block">Status</Label><Select value={form.status} onChange={(event) => set("status", event.target.value as typeof form.status)}>{QUOTATION_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</Select></div>
        <div className="rounded-lg border border-border bg-secondary/40 p-4 sm:col-span-2">
          <div className="ml-auto grid max-w-xs gap-2 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatINR(totals.subtotal)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>- {formatINR(totals.discount)}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>{formatINR(totals.taxAmount)}</span></div><div className="flex justify-between border-t border-border pt-2 text-base font-bold"><span>Total</span><span>{formatINR(totals.totalAmount)}</span></div></div>
        </div>
        <div className="sm:col-span-2"><Label className="mb-1.5 block">Customer notes</Label><Textarea value={form.notes} onChange={(event) => set("notes", event.target.value)} className="min-h-20" /></div>
      </div>
      <div className="sticky bottom-0 z-10 -mx-5 -mb-5 flex flex-col-reverse gap-2 border-t border-border bg-background/95 px-5 py-4 backdrop-blur sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="gradient" className="w-full sm:w-auto" disabled={loading}>{loading ? <Loader2 className="size-4 animate-spin" /> : null}{editing ? "Save quotation" : "Create quotation"}</Button>
      </div>
    </form>
  );
}

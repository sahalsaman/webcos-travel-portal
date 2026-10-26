"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, LayoutTemplate, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface QuotationSettings {
  quotationTerms: string;
  quotationPolicy: string;
  quotationImportantInformation: string;
  quotationOtherInformation: string;
  quotationTheme: string;
  quotationColor: string;
}

export function QuotationSettingsForm({ settings }: { settings: QuotationSettings }) {
  const router = useRouter();
  const [form, setForm] = useState(settings);
  const [loading, setLoading] = useState(false);
  const [templateModal, setTemplateModal] = useState(false);

  function set(key: keyof QuotationSettings, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Unable to save quotation setup");
      toast.success("Quotation setup saved");
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="size-5 text-primary" />Quotation Setup</CardTitle>
          <p className="text-sm text-muted-foreground">These defaults are copied into every new quotation and can be adjusted for an individual customer.</p>
        </CardHeader>
        <CardContent className="grid items-start gap-x-5 gap-y-5 lg:grid-cols-2">
          <Field label="Terms & Conditions" value={form.quotationTerms} onChange={(value) => set("quotationTerms", value)} placeholder="Payment schedule, validity, cancellation terms…" />
          <Field label="Policy" value={form.quotationPolicy} onChange={(value) => set("quotationPolicy", value)} placeholder="Booking, refund and amendment policy…" />
          <Field label="Important Information" value={form.quotationImportantInformation} onChange={(value) => set("quotationImportantInformation", value)} placeholder="Documents, check-in time, travel requirements…" />
          <Field label="Other Information" value={form.quotationOtherInformation} onChange={(value) => set("quotationOtherInformation", value)} placeholder="Any additional standard information…" />
          <div className="lg:col-span-2 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4"><div><p className="font-semibold">Quotation template</p><p className="mt-1 text-sm text-muted-foreground">Current template: <span className="capitalize">{form.quotationTheme}</span></p></div><Button type="button" variant="outline" onClick={() => setTemplateModal(true)}><LayoutTemplate className="size-4" />View templates</Button></div>
          <div className="lg:col-span-2">
            <Button type="submit" variant="gradient" disabled={loading}>{loading ? <Loader2 className="size-4 animate-spin" /> : null}Save quotation setup</Button>
          </div>
        </CardContent>
      </Card>
      {templateModal ? <TemplateModal selected={form.quotationTheme} color={form.quotationColor} onSelect={(quotationTheme) => set("quotationTheme", quotationTheme)} onColorChange={(quotationColor) => set("quotationColor", quotationColor)} onClose={() => setTemplateModal(false)} /> : null}
    </form>
  );
}

function Field({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (value: string) => void }) {
  return <div><Label className="mb-1.5 block">{label}</Label><Textarea className="min-h-36 resize-y" value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></div>;
}

const templates = [
  { id: "classic", name: "Classic", detail: "Formal document with itemised pricing" },
  { id: "ocean", name: "Journey", detail: "Itinerary-led layout with a travel summary" },
  { id: "sunset", name: "Premium", detail: "Elegant offer with a strong total panel" },
];

const brandColors = ["#0f766e", "#0284c7", "#4338ca", "#be123c", "#c2410c", "#166534", "#334155"];

function TemplateModal({ selected, color, onSelect, onColorChange, onClose }: { selected: string; color: string; onSelect: (template: string) => void; onColorChange: (color: string) => void; onClose: () => void }) {
  return <div className="fixed inset-0 z-[90]">
    <button type="button" className="absolute inset-0 bg-black/45" onClick={onClose} aria-label="Close quotation template selector" />
    <div role="dialog" aria-modal="true" aria-labelledby="quotation-template-title" className="absolute left-1/2 top-1/2 max-h-[90vh] w-[min(94vw,900px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-background p-6 shadow-2xl">
      <div className="flex items-start justify-between gap-4"><div><h2 id="quotation-template-title" className="text-lg font-bold">Quotation templates</h2><p className="mt-1 text-sm text-muted-foreground">Preview a layout and select the default template for new quotations.</p></div><Button type="button" size="icon" variant="ghost" onClick={onClose} aria-label="Close"><X className="size-5" /></Button></div>
      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border bg-muted/30 p-3"><span className="text-sm font-medium">Brand colour</span>{brandColors.map((brandColor) => <button key={brandColor} type="button" aria-label={`Use ${brandColor} as the brand colour`} onClick={() => onColorChange(brandColor)} className={`size-7 rounded-full border-2 transition-transform ${color === brandColor ? "scale-110 border-foreground ring-2 ring-primary/25" : "border-white"}`} style={{ backgroundColor: brandColor }} />)}<label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">Custom <input aria-label="Custom quotation brand colour" type="color" value={color} onChange={(event) => onColorChange(event.target.value)} className="size-8 cursor-pointer rounded border-0 bg-transparent p-0" /></label></div>
      <div className="mt-5 grid gap-5 md:grid-cols-3">{templates.map((template) => <button key={template.id} type="button" onClick={() => onSelect(template.id)} className={`overflow-hidden rounded-xl border-2 bg-background text-left transition-all ${selected === template.id ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"}`}>
        <TemplatePreview template={template.id} color={color} />
        <div className="border-t p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-semibold">{template.name}</p><p className="mt-1 text-xs text-muted-foreground">{template.detail}</p></div>{selected === template.id ? <span className="rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">Selected</span> : null}</div></div>
      </button>)}</div>
    </div>
  </div>;
}

function TemplatePreview({ template, color }: { template: string; color: string }) {
  const header = <div className="rounded-sm px-2.5 py-2 text-[8px] font-bold tracking-wide text-white" style={{ backgroundColor: color }}>VOIBEE TRAVELS <span className="float-right font-normal">QUOTATION</span><p className="mt-1 text-[6px] font-normal opacity-85">Your next escape starts here</p></div>;
  if (template === "ocean") return <div className="m-3 min-h-64 overflow-hidden rounded-md border border-slate-200 bg-white text-slate-700 shadow-sm"><div className="p-3">{header}<div className="mt-3 rounded-sm p-2 text-white" style={{ backgroundColor: color }}><p className="text-[7px] opacity-80">CURATED JOURNEY</p><p className="mt-1 text-[10px] font-bold">5 Nights in Kerala</p><p className="mt-1 text-[6px] opacity-90">Munnar · Thekkady · Alleppey</p></div><div className="mt-3 grid grid-cols-3 gap-1 text-center text-[6px]"><div className="rounded bg-slate-50 p-1.5"><b>15 Nov</b><br />Departure</div><div className="rounded bg-slate-50 p-1.5"><b>2</b><br />Travellers</div><div className="rounded bg-slate-50 p-1.5"><b>5</b><br />Nights</div></div><p className="mt-3 text-[7px] font-bold">Your itinerary</p><div className="mt-1.5 space-y-1 text-[6px]"><p>Day 1 · Munnar arrival & leisure</p><p>Day 2 · Tea gardens & Eravikulam</p><p>Day 3 · Thekkady wildlife tour</p></div></div><p className="px-3 pb-3 text-right text-[10px] font-bold" style={{ color }}>₹40,500</p></div>;
  if (template === "sunset") return <div className="m-3 min-h-64 rounded-md border border-slate-200 bg-white p-3 text-slate-700 shadow-sm"><div className="flex items-center justify-between border-b pb-2"><div className="text-[9px] font-bold" style={{ color }}>VOIBEE</div><span className="text-[6px] text-slate-400">QT-2026-041</span></div><p className="mt-4 text-[6px] uppercase tracking-wider text-slate-400">Exclusive escape for</p><p className="mt-1 text-[11px] font-bold">Ananya Nair</p><p className="mt-3 text-[13px] font-bold leading-tight">Kerala, a journey through nature</p><p className="mt-1 text-[6px] text-slate-500">15–20 November 2026 · 2 travellers</p><div className="mt-4 rounded-sm p-2.5 text-white" style={{ backgroundColor: color }}><p className="text-[6px] opacity-85">YOUR TOTAL PACKAGE</p><p className="mt-1 text-[15px] font-bold">₹40,500</p><p className="mt-1 text-[6px] opacity-85">Deluxe stays · Transfers · Sightseeing</p></div><p className="mt-3 text-[6px] text-slate-400">Includes breakfast, private vehicle and all listed experiences.</p></div>;
  return <div className="m-3 min-h-64 rounded-md border-t-8 border-slate-200 bg-white p-3 text-slate-700 shadow-sm" style={{ borderTopColor: color }}>{header}<div className="mt-3 flex justify-between text-[7px]"><div><p className="font-bold">Prepared for</p><p className="mt-0.5">Ananya Nair</p><p className="text-slate-400">+91 98765 43210</p></div><div className="text-right"><p className="font-bold">Quote no.</p><p className="mt-0.5">QT-2026-041</p><p className="text-slate-400">Valid until 30 Oct</p></div></div><div className="mt-3 rounded-sm bg-slate-50 p-2"><p className="text-[8px] font-bold">5 Nights in Kerala</p><p className="mt-0.5 text-[6px] text-slate-500">Munnar · Thekkady · Alleppey</p></div><div className="mt-3 border-y border-slate-100 py-2 text-[6px]"><div className="flex justify-between"><span>Deluxe stay with breakfast</span><span>₹32,000</span></div><div className="mt-1 flex justify-between"><span>Transfers & sightseeing</span><span>₹8,500</span></div></div><div className="mt-2 text-right"><p className="text-[6px] text-slate-500">Total package</p><p className="text-[10px] font-bold" style={{ color }}>₹40,500</p></div></div>;
}

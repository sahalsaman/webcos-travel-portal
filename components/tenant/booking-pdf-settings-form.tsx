"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileDown, LayoutTemplate, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TemplateModal } from "@/components/tenant/quotation-settings-form";

export function BookingPdfSettingsForm({ settings }: { settings: { bookingPdfTheme: string; bookingPdfColor: string } }) {
  const router = useRouter();
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const response = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to save booking PDF settings");
      toast.success("Booking PDF template saved");
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return <><Card><CardHeader><CardTitle className="flex items-center gap-2"><FileDown className="size-5 text-primary" />Booking PDF template</CardTitle><p className="text-sm text-muted-foreground">Choose the design and brand colour used on customer booking confirmations.</p></CardHeader><CardContent className="flex flex-wrap items-center justify-between gap-4 rounded-b-xl border-t bg-muted/20 py-5"><div><p className="font-semibold capitalize">{form.bookingPdfTheme} template</p><p className="mt-1 text-sm text-muted-foreground">Brand colour <span className="inline-block size-3 rounded-full align-middle" style={{ backgroundColor: form.bookingPdfColor }} /> {form.bookingPdfColor}</p></div><div className="flex gap-2"><Button type="button" variant="outline" onClick={() => setOpen(true)}><LayoutTemplate className="size-4" />View templates</Button><Button type="button" variant="gradient" disabled={saving} onClick={() => void save()}>{saving ? <Loader2 className="size-4 animate-spin" /> : null}Save booking PDF</Button></div></CardContent></Card>{open ? <TemplateModal documentLabel="Booking PDF" selected={form.bookingPdfTheme} color={form.bookingPdfColor} onSelect={(bookingPdfTheme) => setForm((current) => ({ ...current, bookingPdfTheme }))} onColorChange={(bookingPdfColor) => setForm((current) => ({ ...current, bookingPdfColor }))} onClose={() => setOpen(false)} /> : null}</>;
}

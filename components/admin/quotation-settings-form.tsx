"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2 } from "lucide-react";
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
}

export function QuotationSettingsForm({ settings }: { settings: QuotationSettings }) {
  const router = useRouter();
  const [form, setForm] = useState(settings);
  const [loading, setLoading] = useState(false);

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
          <div className="lg:col-span-2">
            <Button type="submit" variant="gradient" disabled={loading}>{loading ? <Loader2 className="size-4 animate-spin" /> : null}Save quotation setup</Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

function Field({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (value: string) => void }) {
  return <div><Label className="mb-1.5 block">{label}</Label><Textarea className="min-h-36 resize-y" value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></div>;
}

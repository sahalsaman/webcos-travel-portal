"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateCommission } from "@/lib/commission";
import { formatINR } from "@/lib/utils";

interface Settings {
  defaultCommission: number;
  platformFeePercent: number;
  platformFeeFlat: number;
  minWithdrawal: number;
  currency: string;
}

export function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(settings);

  function set<K extends keyof Settings>(k: K, v: Settings[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // Live preview against the spec example (base ₹10,000).
  const preview = calculateCommission({
    basePrice: 10000,
    commission: form.defaultCommission,
    seats: 1,
    config: {
      platformFeePercent: form.platformFeePercent,
      platformFeeFlat: form.platformFeeFlat,
    },
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      toast.success("Settings saved");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Card>
        <CardHeader>
          <CardTitle>Commission & Platform Fees</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="mb-1.5 block">Default partner commission (₹)</Label>
            <Input type="number" min={0} value={form.defaultCommission} onChange={(e) => set("defaultCommission", Number(e.target.value))} />
          </div>
          <div>
            <Label className="mb-1.5 block">Min withdrawal (₹)</Label>
            <Input type="number" min={0} value={form.minWithdrawal} onChange={(e) => set("minWithdrawal", Number(e.target.value))} />
          </div>
          <div>
            <Label className="mb-1.5 block">Platform fee (% of commission)</Label>
            <Input type="number" min={0} max={100} value={form.platformFeePercent} onChange={(e) => set("platformFeePercent", Number(e.target.value))} />
          </div>
          <div>
            <Label className="mb-1.5 block">Platform fee (flat ₹ / seat)</Label>
            <Input type="number" min={0} value={form.platformFeeFlat} onChange={(e) => set("platformFeeFlat", Number(e.target.value))} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" variant="gradient" disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              Save settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-secondary/40">
        <CardHeader>
          <CardTitle>Live preview (base ₹10,000)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Base price" value={formatINR(preview.basePrice)} />
          <Row label="Partner commission" value={formatINR(preview.commission)} />
          <Row label="Platform fee" value={formatINR(preview.platformFee)} />
          <div className="my-2 h-px bg-border" />
          <Row label="Traveler pays" value={formatINR(preview.travelerPays)} bold />
          <Row label="Partner earns" value={formatINR(preview.partnerEarns)} />
          <Row label="Operator receives" value={formatINR(preview.adminReceives)} />
        </CardContent>
      </Card>
    </form>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={bold ? "font-bold" : "font-medium"}>{value}</span>
    </div>
  );
}

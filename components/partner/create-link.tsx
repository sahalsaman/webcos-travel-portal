"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Link2, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatINR } from "@/lib/utils";

export function CreateLink({
  tripId,
  basePrice,
  defaultCommission,
  existingCommission,
}: {
  tripId: string;
  basePrice: number;
  defaultCommission: number;
  existingCommission: number | null;
}) {
  const router = useRouter();
  const [commission, setCommission] = useState(
    existingCommission ?? defaultCommission,
  );
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const sellingPrice = basePrice + Math.max(0, commission);

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/partner/white-label", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, commission: Number(commission) }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      setUrl(data.data.url);
      toast.success(existingCommission != null ? "Link updated" : "Link created");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-3 border-t border-border pt-3">
      <div>
        <Label className="mb-1 block text-xs">Your commission (₹)</Label>
        <Input
          type="number"
          min={0}
          value={commission}
          onChange={(e) => setCommission(Number(e.target.value))}
          className="h-9"
        />
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Selling price</span>
        <span className="font-semibold">{formatINR(sellingPrice)}</span>
      </div>
      <Button onClick={generate} disabled={loading} variant="gradient" size="sm" className="w-full">
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
        {existingCommission != null ? "Update link" : "Generate link"}
      </Button>

      {url ? (
        <div className="flex items-center gap-2 rounded-lg bg-secondary p-2">
          <span className="flex-1 truncate font-mono text-xs">{url}</span>
          <Button size="icon" variant="ghost" className="size-7" onClick={copy}>
            {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

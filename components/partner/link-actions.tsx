"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Check, Trash2, Loader2, Power } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LinkActions({
  id,
  url,
  active,
}: {
  id: string;
  url: string;
  active: boolean;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function patch(body: object) {
    setBusy(true);
    try {
      const res = await fetch(`/api/partner/white-label/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("Remove this white-label link?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/partner/white-label/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      toast.success("Link removed");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon" onClick={copy} aria-label="Copy">
        {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => patch({ active: !active })}
        disabled={busy}
        aria-label="Toggle active"
        title={active ? "Deactivate" : "Activate"}
      >
        <Power className={active ? "size-4 text-success" : "size-4 text-muted-foreground"} />
      </Button>
      <Button variant="ghost" size="icon" onClick={remove} disabled={busy} aria-label="Delete">
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4 text-destructive" />}
      </Button>
    </div>
  );
}

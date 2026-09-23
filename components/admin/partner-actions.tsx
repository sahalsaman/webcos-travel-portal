"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Ban, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PartnerActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function update(next: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/partners/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      toast.success(`Partner ${next}`);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-end gap-2">
      {loading ? <Loader2 className="size-4 animate-spin self-center" /> : null}
      {status !== "approved" ? (
        <Button size="sm" variant="default" onClick={() => update("approved")} disabled={loading}>
          <Check className="size-4" /> Approve
        </Button>
      ) : null}
      {status !== "suspended" ? (
        <Button size="sm" variant="outline" onClick={() => update("suspended")} disabled={loading}>
          <Ban className="size-4" /> Suspend
        </Button>
      ) : (
        <Button size="sm" variant="outline" onClick={() => update("approved")} disabled={loading}>
          <RotateCcw className="size-4" /> Reinstate
        </Button>
      )}
    </div>
  );
}

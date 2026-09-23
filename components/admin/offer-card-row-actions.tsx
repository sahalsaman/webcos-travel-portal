"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OfferCardDrawer } from "@/components/admin/offer-card-drawer";
import type { OfferCardDTO } from "@/types";

export function OfferCardRowActions({ offer }: { offer: OfferCardDTO }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function onDelete() {
    if (!confirm("Delete this banner slide?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/offers/${offer._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Delete failed");
      toast.success("Banner slide deleted");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
      setDeleting(false);
    }
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <OfferCardDrawer offer={offer} />
      <Button variant="ghost" size="icon" aria-label="Delete" onClick={onDelete} disabled={deleting}>
        {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4 text-destructive" />}
      </Button>
    </div>
  );
}

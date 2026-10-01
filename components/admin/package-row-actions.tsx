"use client";

import { Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function PackageRowActions({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function deletePackage() {
    if (!window.confirm(`Delete “${title}”? This is available only when the package has no customer bookings.`)) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/trips/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to delete package");
      toast.success("Package deleted");
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  return <div className="flex justify-end gap-2">
    <Button asChild variant="outline" size="sm"><Link href={`/admin/inventory/packages/${id}/edit`}><Pencil className="size-3.5" />Edit</Link></Button>
    <Button type="button" variant="outline" size="sm" disabled={deleting} onClick={() => void deletePackage()} className="text-destructive hover:bg-destructive/10 hover:text-destructive"><Trash2 className="size-3.5" />{deleting ? "Deleting" : "Delete"}</Button>
  </div>;
}

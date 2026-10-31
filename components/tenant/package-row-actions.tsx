"use client";

import { Copy, Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function PackageRowActions({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [open, setOpen] = useState(false);

  async function duplicatePackage() {
    setDuplicating(true);
    try {
      const response = await fetch(`/api/trips/${id}`, { method: "POST" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to duplicate package");
      toast.success("Package duplicated as a draft");
      setOpen(false);
      router.push(`/inventory/packages/${result.data.id}/edit`);
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setDuplicating(false);
    }
  }

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

  return <div className="relative inline-flex">
    <Button type="button" variant="ghost" size="icon" aria-label={`Actions for ${title}`} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
      <MoreHorizontal className="size-4" />
    </Button>
    {open ? <div className="absolute right-0 top-10 z-20 w-40 rounded-lg border border-border bg-popover p-1 text-left shadow-lg">
      <Button asChild variant="ghost" size="sm" className="w-full justify-start"><Link href={`/inventory/packages/${id}/edit`} onClick={() => setOpen(false)}><Pencil />Edit</Link></Button>
      <Button type="button" variant="ghost" size="sm" className="w-full justify-start" disabled={duplicating} onClick={() => void duplicatePackage()}>{duplicating ? <Loader2 className="animate-spin" /> : <Copy />}Duplicate</Button>
      <Button type="button" variant="ghost" size="sm" className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={deleting} onClick={() => void deletePackage()}>{deleting ? <Loader2 className="animate-spin" /> : <Trash2 />}Delete</Button>
    </div> : null}
  </div>;
}

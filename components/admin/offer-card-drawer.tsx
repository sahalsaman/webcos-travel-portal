"use client";

import { useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { OfferCardForm } from "@/components/admin/offer-card-form";
import { Button } from "@/components/ui/button";
import type { OfferCardDTO } from "@/types";

export function OfferCardDrawer({ offer }: { offer?: OfferCardDTO }) {
  const [open, setOpen] = useState(false);
  return <>
    {offer ? <Button type="button" variant="ghost" size="icon" aria-label={`Edit ${offer.title}`} onClick={() => setOpen(true)}><Pencil className="size-4" /></Button> : <Button type="button" variant="gradient" onClick={() => setOpen(true)}><Plus className="size-4" />New Slide</Button>}
    {open ? <div className="fixed inset-0 z-[80]"><button type="button" className="absolute inset-0 bg-black/45" onClick={() => setOpen(false)} aria-label="Close banner form" /><aside role="dialog" aria-modal="true" className="absolute right-0 top-0 flex h-full w-full max-w-3xl flex-col border-l border-border bg-background shadow-2xl"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="text-lg font-bold">{offer ? "Edit Banner Slide" : "New Banner Slide"}</h2><p className="text-sm text-muted-foreground">{offer?.title ?? "Create a homepage carousel slide"}</p></div><Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close"><X className="size-5" /></Button></div><div className="min-h-0 flex-1 overflow-y-auto p-5"><OfferCardForm offer={offer} onSaved={() => setOpen(false)} onCancel={() => setOpen(false)} /></div></aside></div> : null}
  </>;
}

"use client";

import { useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CampaignForm } from "@/components/admin/campaign-form";
import type { CampaignDTO } from "@/types";

export function CampaignDrawer({ campaign }: { campaign?: CampaignDTO }) {
  const [open, setOpen] = useState(false);
  const editing = Boolean(campaign);

  return (
    <>
      {editing ? (
        <Button type="button" variant="ghost" size="icon" aria-label={`Edit ${campaign!.name}`} onClick={() => setOpen(true)}>
          <Pencil className="size-4" />
        </Button>
      ) : (
        <Button type="button" variant="gradient" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Add Campaign
        </Button>
      )}

      {open ? (
        <div className="fixed inset-0 z-[80]">
          <button type="button" className="absolute inset-0 bg-black/45" onClick={() => setOpen(false)} aria-label="Close campaign form" />
          <aside role="dialog" aria-modal="true" aria-labelledby="campaign-drawer-title" className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col border-l border-border bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="min-w-0 pr-3">
                <h2 id="campaign-drawer-title" className="text-lg text-left font-bold">{editing ? "Edit Campaign" : "Add Campaign"}</h2>
                <p className="truncate text-sm text-muted-foreground">{editing ? campaign!.name : "Plan and track a marketing campaign"}</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close"><X className="size-5" /></Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <CampaignForm campaign={campaign} onSaved={() => setOpen(false)} onCancel={() => setOpen(false)} />
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}

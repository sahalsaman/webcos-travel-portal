"use client";

import { useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SupplierForm } from "@/components/admin/supplier-form";
import type { SupplierDTO } from "@/types";

export function SupplierDrawer({ supplier, defaultType, supplierOptions, requireSupplierSelection = false }: { supplier?: SupplierDTO; defaultType?: SupplierDTO["type"]; supplierOptions?: SupplierDTO[]; requireSupplierSelection?: boolean }) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(supplier?._id ?? "");
  const editing = Boolean(supplier);
  const selectedSupplier = supplier ?? supplierOptions?.find((item) => item._id === selectedId);
  const inventoryLabel = defaultType === "Hotel" ? "Hotel" : defaultType === "Transport" ? "Vehicle" : "Supplier";

  return (
    <>
      {editing ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Edit ${supplier!.companyName}`}
          onClick={() => setOpen(true)}
        >
          <Pencil className="size-4" />
        </Button>
      ) : (
        <Button type="button" variant="gradient" onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Add {inventoryLabel}
        </Button>
      )}

      {open ? (
        <div className="fixed inset-0 z-[80]">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            onClick={() => setOpen(false)}
            aria-label="Close supplier form"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="supplier-drawer-title"
            className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col border-l border-border bg-background shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="min-w-0 pr-3">
                <h2 id="supplier-drawer-title" className="text-lg font-bold">
                  {editing ? `Edit ${inventoryLabel}` : `Add ${inventoryLabel}`}
                </h2>
                <p className="truncate text-sm text-muted-foreground">
                  {editing ? supplier!.companyName : "Create a supplier record for your operations team"}
                </p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close">
                <X className="size-5" />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {requireSupplierSelection ? (
                <div className="mb-5 space-y-1.5 rounded-lg border border-border bg-secondary/30 p-4">
                  <Label htmlFor="inventory-supplier">Supplier *</Label>
                  <Select id="inventory-supplier" value={selectedId} onChange={(event) => setSelectedId(event.target.value)} disabled={editing} required>
                    <option value="">Select supplier</option>
                    {supplierOptions?.map((option) => <option key={option._id} value={option._id}>{option.companyName} · {option.phone}</option>)}
                  </Select>
                  <p className="text-xs text-muted-foreground">Select the supplier record used for this {inventoryLabel.toLowerCase()}.</p>
                </div>
              ) : null}
              {!requireSupplierSelection || selectedSupplier ? (
                <SupplierForm
                  key={selectedSupplier?._id ?? "new"}
                  supplier={selectedSupplier ? { ...selectedSupplier, type: defaultType ?? selectedSupplier.type } : undefined}
                  defaultType={defaultType}
                  onSaved={() => setOpen(false)}
                  onCancel={() => setOpen(false)}
                />
              ) : (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Select a supplier above to continue.</div>
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}

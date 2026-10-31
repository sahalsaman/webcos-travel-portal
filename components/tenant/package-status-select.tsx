"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select } from "@/components/ui/select";
import { TRIP_STATUSES, type TripStatus } from "@/lib/constants";

function statusLabel(status: TripStatus) {
  return status === "soldout" ? "Sold out" : status.charAt(0).toUpperCase() + status.slice(1);
}

export function PackageStatusSelect({ id, status }: { id: string; status: TripStatus }) {
  const router = useRouter();
  const [value, setValue] = useState<TripStatus>(status);
  const [saving, setSaving] = useState(false);

  async function changeStatus(next: TripStatus) {
    const previous = value;
    setValue(next);
    setSaving(true);
    try {
      const response = await fetch(`/api/trips/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Unable to update package status");
      toast.success(`Package marked ${statusLabel(next).toLowerCase()}`);
      router.refresh();
    } catch (error) {
      setValue(previous);
      toast.error((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Select
      value={value}
      onChange={(event) => void changeStatus(event.target.value as TripStatus)}
      disabled={saving}
      className="h-8 w-32 text-xs font-medium"
      aria-label="Package status"
    >
      {TRIP_STATUSES.map((item) => <option key={item} value={item}>{statusLabel(item)}</option>)}
    </Select>
  );
}

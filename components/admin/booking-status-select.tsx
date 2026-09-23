"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select } from "@/components/ui/select";
import { BOOKING_STATUSES } from "@/lib/constants";

export function BookingStatusSelect({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);

  async function onChange(next: string) {
    const prev = value;
    setValue(next);
    setSaving(true);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      toast.success(`Marked ${next}`);
      router.refresh();
    } catch (err) {
      setValue(prev);
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={saving}
      className="h-8 w-36 text-xs capitalize"
    >
      {BOOKING_STATUSES.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </Select>
  );
}

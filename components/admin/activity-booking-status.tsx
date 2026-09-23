"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Select } from "@/components/ui/select";
import { ACTIVITY_BOOKING_STATUSES, type ActivityBookingStatus } from "@/lib/constants";

export function ActivityBookingStatusSelect({ id, status }: { id: string; status: ActivityBookingStatus }) { const router = useRouter(); const [value, setValue] = useState(status); const [loading, setLoading] = useState(false); async function update(next: ActivityBookingStatus) { const previous = value; setValue(next); setLoading(true); try { const response = await fetch(`/api/admin/activity-bookings/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) }); const data = await response.json(); if (!response.ok || !data.success) throw new Error(data.message || "Update failed"); toast.success("Booking status updated"); router.refresh(); } catch (error) { setValue(previous); toast.error((error as Error).message); } finally { setLoading(false); } } return <Select value={value} onChange={(e) => update(e.target.value as ActivityBookingStatus)} disabled={loading} className="w-36">{ACTIVITY_BOOKING_STATUSES.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</Select>; }

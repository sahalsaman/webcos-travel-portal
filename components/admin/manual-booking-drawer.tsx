"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BOOKING_STATUSES, PAYMENT_STATUSES } from "@/lib/constants";
import { formatINR } from "@/lib/utils";

interface BookableTrip {
  _id: string;
  title: string;
  destination: string;
  basePrice: number;
  availableSeats: number;
  totalSeats: number;
}

type ManualBookingField = "tripId" | "seats" | "name" | "email" | "mobile" | "status" | "paymentStatus";
type FieldErrors = Partial<Record<ManualBookingField, string>>;

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label>
      {children} <span className="text-destructive">*</span>
    </Label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-medium text-destructive">{message}</p>;
}

export function ManualBookingDrawer({ trips }: { trips: BookableTrip[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState({
    tripId: trips[0]?._id ?? "",
    seats: 1,
    name: "",
    email: "",
    mobile: "",
    notes: "",
    status: "confirmed",
    paymentStatus: "paid",
  });

  const selectedTrip = useMemo(
    () => trips.find((trip) => trip._id === form.tripId),
    [form.tripId, trips],
  );
  const totalAmount = (selectedTrip?.basePrice ?? 0) * Number(form.seats || 0);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const field = key as ManualBookingField;
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function validateForm() {
    const next: FieldErrors = {};
    const seats = Number(form.seats);

    if (!form.tripId || !selectedTrip) next.tripId = "Select a package";
    if (!Number.isInteger(seats) || seats < 1) {
      next.seats = "Enter at least 1 seat";
    } else if (selectedTrip && seats > selectedTrip.availableSeats) {
      next.seats = `Only ${selectedTrip.availableSeats} seat(s) left`;
    }
    if (form.name.trim().length < 2) next.name = "Enter traveler name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Enter a valid email address";
    if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) next.mobile = "Enter a valid 10-digit mobile number";
    if (!form.status) next.status = "Select booking status";
    if (!form.paymentStatus) next.paymentStatus = "Select payment status";

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function close() {
    if (!loading) setOpen(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the highlighted fields");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId: form.tripId,
          seats: Number(form.seats),
          status: form.status,
          paymentStatus: form.paymentStatus,
          travelerDetails: {
            name: form.name,
            email: form.email,
            mobile: form.mobile,
            travellers: Number(form.seats),
            notes: form.notes || undefined,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        const firstError = data.errors
          ? Object.values(data.errors).flat().filter(Boolean)[0]
          : null;
        throw new Error(String(firstError || data.message || "Booking failed"));
      }
      toast.success(`Booking ${data.data.bookingNumber} created`);
      setOpen(false);
      setErrors({});
      setForm({
        tripId: trips[0]?._id ?? "",
        seats: 1,
        name: "",
        email: "",
        mobile: "",
        notes: "",
        status: "confirmed",
        paymentStatus: "paid",
      });
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button type="button" variant="gradient" onClick={() => setOpen(true)}>
        <Plus className="size-4" /> Add Booking
      </Button>

      {open ? (
        <div className="fixed inset-0 z-[80]">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            onClick={close}
            aria-label="Close manual booking form"
          />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-border bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-lg font-bold">Add manual booking</h2>
                <p className="text-sm text-muted-foreground">Create an offline/admin booking</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={close} aria-label="Close">
                <X className="size-5" />
              </Button>
            </div>

            <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
                <div className="space-y-1.5">
                  <RequiredLabel>Package</RequiredLabel>
                  <Select
                    value={form.tripId}
                    onChange={(e) => set("tripId", e.target.value)}
                    required
                    aria-invalid={Boolean(errors.tripId)}
                    className={errors.tripId ? "border-destructive" : undefined}
                  >
                    {trips.map((trip) => (
                      <option key={trip._id} value={trip._id}>
                        {trip.title} - {trip.destination} ({trip.availableSeats} seats)
                      </option>
                    ))}
                  </Select>
                  <FieldError message={errors.tripId} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <RequiredLabel>Seats</RequiredLabel>
                    <Input
                      type="number"
                      min={1}
                      max={selectedTrip?.availableSeats || 1}
                      value={form.seats}
                      onChange={(e) => set("seats", Number(e.target.value))}
                      required
                      aria-invalid={Boolean(errors.seats)}
                      className={errors.seats ? "border-destructive" : undefined}
                    />
                    <FieldError message={errors.seats} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Total amount</Label>
                    <Input value={formatINR(totalAmount)} readOnly aria-readonly="true" className="bg-secondary/40" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <RequiredLabel>Traveler name</RequiredLabel>
                    <Input
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      required
                      aria-invalid={Boolean(errors.name)}
                      className={errors.name ? "border-destructive" : undefined}
                    />
                    <FieldError message={errors.name} />
                  </div>
                  <div className="space-y-1.5">
                    <RequiredLabel>Email</RequiredLabel>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      required
                      aria-invalid={Boolean(errors.email)}
                      className={errors.email ? "border-destructive" : undefined}
                    />
                    <FieldError message={errors.email} />
                  </div>
                  <div className="space-y-1.5">
                    <RequiredLabel>Mobile</RequiredLabel>
                    <Input
                      value={form.mobile}
                      onChange={(e) => set("mobile", e.target.value.replace(/\D/g, ""))}
                      placeholder="10 digit mobile"
                      required
                      maxLength={10}
                      minLength={10}
                      aria-invalid={Boolean(errors.mobile)}
                      className={errors.mobile ? "border-destructive" : undefined}
                    />
                    <FieldError message={errors.mobile} />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <RequiredLabel>Booking status</RequiredLabel>
                    <Select
                      value={form.status}
                      onChange={(e) => set("status", e.target.value)}
                      aria-invalid={Boolean(errors.status)}
                      className={errors.status ? "border-destructive" : undefined}
                    >
                      {BOOKING_STATUSES.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </Select>
                    <FieldError message={errors.status} />
                  </div>
                  <div className="space-y-1.5">
                    <RequiredLabel>Payment status</RequiredLabel>
                    <Select
                      value={form.paymentStatus}
                      onChange={(e) => set("paymentStatus", e.target.value)}
                      aria-invalid={Boolean(errors.paymentStatus)}
                      className={errors.paymentStatus ? "border-destructive" : undefined}
                    >
                      {PAYMENT_STATUSES.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </Select>
                    <FieldError message={errors.paymentStatus} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} className="min-h-24" />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
                <Button type="button" variant="outline" onClick={close} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" disabled={loading || trips.length === 0}>
                  {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                  Create booking
                </Button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </>
  );
}

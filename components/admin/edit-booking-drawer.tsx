"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Pencil, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type EditableBooking = {
  _id: string;
  bookingNumber: string;
  seats: number;
  totalAmount: number;
  paymentStatus: string;
  traveler?: { name?: string; email?: string } | null;
  travelerDetails?: {
    name?: string;
    email?: string;
    mobile?: string;
    travellers?: number;
    notes?: string;
  };
};

type BookingField = "name" | "email" | "mobile" | "travellers" | "totalAmount";
type FieldErrors = Partial<Record<BookingField, string>>;

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

function firstServerError(errors: unknown) {
  if (!errors || typeof errors !== "object") return null;
  return Object.values(errors as Record<string, unknown>)
    .flat()
    .filter(Boolean)[0];
}

export function EditBookingDrawer({ booking }: { booking: EditableBooking }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [form, setForm] = useState({
    name: booking.travelerDetails?.name || booking.traveler?.name || "",
    email: booking.travelerDetails?.email || booking.traveler?.email || "",
    mobile: booking.travelerDetails?.mobile || "",
    travellers: booking.travelerDetails?.travellers || booking.seats || 1,
    totalAmount: booking.totalAmount,
    notes: booking.travelerDetails?.notes || "",
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      const field = key as BookingField;
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function validateForm() {
    const next: FieldErrors = {};
    const travellers = Number(form.travellers);
    const totalAmount = Number(form.totalAmount);
    if (form.name.trim().length < 2) next.name = "Enter traveler name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Enter a valid email address";
    if (!/^[6-9]\d{9}$/.test(form.mobile.trim())) next.mobile = "Enter a valid 10-digit mobile number";
    if (!Number.isInteger(travellers) || travellers < 1) next.travellers = "Enter at least 1 traveler";
    if (!Number.isFinite(totalAmount) || totalAmount < 0) next.totalAmount = "Enter a valid amount";
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
      const res = await fetch(`/api/admin/bookings/${booking._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalAmount: Number(form.totalAmount),
          travelerDetails: {
            name: form.name.trim(),
            email: form.email.trim(),
            mobile: form.mobile.trim(),
            travellers: Number(form.travellers),
            notes: form.notes.trim() || undefined,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(String(firstServerError(data.errors) || data.message || "Booking update failed"));
      }
      toast.success("Booking updated");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function refundBooking() {
    if (!window.confirm(`Refund ${booking.bookingNumber}? This will cancel the booking and reverse inventory and commission.`)) return;
    setRefunding(true);
    try {
      const res = await fetch(`/api/admin/bookings/${booking._id}/refund`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Refund failed");
      toast.success(data.alreadyRefunded ? "Booking was already refunded" : "Booking refunded and cancelled");
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setRefunding(false);
    }
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="size-3.5" /> Edit
      </Button>

      {open ? (
        <div className="fixed inset-0 z-[80]">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            onClick={close}
            aria-label="Close booking edit form"
          />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-lg font-bold">Edit booking</h2>
                <p className="font-mono text-xs text-muted-foreground">{booking.bookingNumber}</p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={close} aria-label="Close">
                <X className="size-5" />
              </Button>
            </div>

            <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
                <div className="space-y-1.5">
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

                <div className="space-y-1.5">
                  <RequiredLabel>Travelers count</RequiredLabel>
                  <Input
                    type="number"
                    min={1}
                    value={form.travellers}
                    onChange={(e) => set("travellers", Number(e.target.value))}
                    required
                    aria-invalid={Boolean(errors.travellers)}
                    className={errors.travellers ? "border-destructive" : undefined}
                  />
                  <FieldError message={errors.travellers} />
                </div>

                <div className="space-y-1.5">
                  <RequiredLabel>Booking amount</RequiredLabel>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.totalAmount}
                    onChange={(e) => set("totalAmount", Number(e.target.value))}
                    required
                    aria-invalid={Boolean(errors.totalAmount)}
                    className={errors.totalAmount ? "border-destructive" : undefined}
                  />
                  <FieldError message={errors.totalAmount} />
                </div>

                <div className="space-y-1.5">
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} className="min-h-28" />
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-4">
                {booking.paymentStatus === "paid" ? (
                  <Button type="button" variant="destructive" onClick={refundBooking} disabled={loading || refunding} className="mr-auto">
                    {refunding ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}
                    Refund
                  </Button>
                ) : null}
                <Button type="button" variant="outline" onClick={close} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" disabled={loading}>
                  {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                  Save changes
                </Button>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </>
  );
}

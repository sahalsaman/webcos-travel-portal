"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuotationDrawer } from "@/components/admin/quotation-drawer";
import { formatDate, formatINR } from "@/lib/utils";
import type { TripDTO, UserDTO } from "@/types";

type TravelerBooking = {
  _id: string;
  bookingNumber: string;
  trip?: { title?: string; destination?: string } | string;
  seats: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
};

type Traveler = UserDTO & {
  createdAt?: string;
  bookingCount: number;
  paidAmount: number;
  lastBookingAt?: string | null;
  bookings: TravelerBooking[];
};

export function TravelerDetailDrawer({ travelers, itineraries }: { travelers: Traveler[]; itineraries: TripDTO[] }) {
  const [selected, setSelected] = useState<Traveler | null>(null);

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="p-4 font-medium">Traveler</th>
              <th className="p-4 font-medium">Mobile</th>
              <th className="p-4 font-medium">Bookings</th>
              <th className="p-4 font-medium">Paid amount</th>
              <th className="p-4 font-medium">Last booking</th>
              <th className="p-4 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {travelers.map((traveler) => (
              <tr key={traveler._id} className="border-b border-border/50 hover:bg-secondary/40">
                <td className="p-4">
                  <p className="font-medium">{traveler.name}</p>
                  <p className="text-xs text-muted-foreground">{traveler.email}</p>
                </td>
                <td className="p-4 text-muted-foreground">{traveler.mobile || "-"}</td>
                <td className="p-4">{traveler.bookingCount}</td>
                <td className="p-4 font-medium">{formatINR(traveler.paidAmount)}</td>
                <td className="p-4 text-muted-foreground">{traveler.lastBookingAt ? formatDate(traveler.lastBookingAt) : "-"}</td>
                <td className="p-4"><div className="flex justify-end gap-2"><QuotationDrawer customer={traveler} customers={travelers} itineraries={itineraries} /><Button variant="outline" size="sm" onClick={() => setSelected(traveler)}>View</Button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 bg-black/35" onClick={() => setSelected(null)}>
          <aside className="ml-auto flex h-full w-full max-w-xl flex-col bg-background shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-border p-5">
              <div>
                <h2 className="text-xl font-semibold">{selected.name}</h2>
                <p className="text-sm text-muted-foreground">{selected.email}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelected(null)}><X className="size-5" /></Button>
            </div>
            <div className="grid gap-3 border-b border-border p-5 text-sm sm:grid-cols-3">
              <div><p className="text-muted-foreground">Mobile</p><p className="font-medium">{selected.mobile || "-"}</p></div>
              <div><p className="text-muted-foreground">Bookings</p><p className="font-medium">{selected.bookingCount}</p></div>
              <div><p className="text-muted-foreground">Paid</p><p className="font-medium">{formatINR(selected.paidAmount)}</p></div>
            </div>
            <div className="border-b border-border px-5 py-4"><QuotationDrawer customer={selected} customers={travelers} itineraries={itineraries} /></div>
            <div className="flex-1 overflow-y-auto p-5">
              <h3 className="mb-3 font-semibold">Booking history</h3>
              <div className="space-y-3">
                {selected.bookings.length ? selected.bookings.map((booking) => {
                  const trip = typeof booking.trip === "object" ? booking.trip : null;
                  return (
                    <div key={booking._id} className="rounded-lg border border-border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{trip?.title || "Package"}</p>
                          <p className="text-xs text-muted-foreground">{booking.bookingNumber} · {trip?.destination || "-"}</p>
                        </div>
                        <p className="font-semibold">{formatINR(booking.totalAmount)}</p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>{booking.seats} seats</span>
                        <span>{booking.status}</span>
                        <span>{booking.paymentStatus}</span>
                        <span>{formatDate(booking.createdAt)}</span>
                      </div>
                    </div>
                  );
                }) : <p className="text-sm text-muted-foreground">No bookings yet.</p>}
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}

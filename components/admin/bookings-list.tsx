"use client";

import { CalendarCheck, Search } from "lucide-react";
import {
  BookingFilters,
  bookingTripStates,
  getBookingTripState,
  type BookingTripState,
} from "@/components/admin/booking-trip-state-filter";
import { BookingRowActions } from "@/components/admin/booking-row-actions";
import { BookingStatusSelect } from "@/components/admin/booking-status-select";
import { EditBookingDrawer } from "@/components/admin/edit-booking-drawer";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatINR } from "@/lib/utils";
import { useMemo, useState } from "react";

export interface AdminBookingRow {
  _id: string;
  bookingNumber: string;
  trip?: {
    _id: string;
    title: string;
    destination: string;
    holidayPackage?: boolean;
    startDate?: string;
    endDate?: string;
    totalSeats?: number;
    availableSeats?: number;
  };
  traveler?: { name: string; email: string };
  partner?: { businessName: string } | null;
  travelerDetails: { name?: string; email?: string; mobile: string; travellers?: number; notes?: string };
  seats: number;
  totalAmount: number;
  partnerEarnings: number;
  status: string;
  paymentStatus: string;
  travelStartDate?: string;
  travelEndDate?: string;
  createdAt: string;
}

function stateForBooking(booking: AdminBookingRow) {
  const startDate = booking.travelStartDate || booking.trip?.startDate || booking.createdAt;
  const endDate = booking.travelEndDate || booking.trip?.endDate || startDate;
  const fixedDeparture = booking.trip?.holidayPackage === false;
  return getBookingTripState({
    startDate,
    endDate,
    totalSeats: fixedDeparture ? booking.trip?.totalSeats : booking.seats,
    availableSeats: fixedDeparture ? booking.trip?.availableSeats : 0,
  });
}

export function AdminBookingsList({
  bookings,
  query,
}: {
  bookings: AdminBookingRow[];
  query: string;
}) {
  const [visibleStates, setVisibleStates] = useState<Set<BookingTripState>>(
    () => new Set(bookingTripStates.map((item) => item.state)),
  );
  const [selectedPackage, setSelectedPackage] = useState("all");
  const [search, setSearch] = useState(query);
  const packageOptions = useMemo(() => Array.from(new Map(bookings.flatMap((booking) => booking.trip ? [[booking.trip._id, {
    id: booking.trip._id,
    title: booking.trip.title,
    destination: booking.trip.destination,
  }] as const] : [])).values()), [bookings]);
  const normalizedQuery = search.trim().toLocaleLowerCase();
  const filteredBookings = useMemo(() => bookings.filter((booking) => {
    if (selectedPackage !== "all" && booking.trip?._id !== selectedPackage) return false;
    if (!visibleStates.has(stateForBooking(booking))) return false;
    if (!normalizedQuery) return true;
    return [
      booking.bookingNumber,
      booking.trip?.title,
      booking.trip?.destination,
      booking.traveler?.name,
      booking.traveler?.email,
      booking.travelerDetails?.name,
      booking.travelerDetails?.email,
      booking.travelerDetails?.mobile,
    ].some((value) => value?.toLocaleLowerCase().includes(normalizedQuery));
  }), [bookings, normalizedQuery, selectedPackage, visibleStates]);

  function toggleState(state: BookingTripState) {
    setVisibleStates((current) => {
      const next = new Set(current);
      if (next.has(state)) next.delete(state);
      else next.add(state);
      return next;
    });
  }

  function resetStates() {
    setSearch("");
    setSelectedPackage("all");
    setVisibleStates(new Set(bookingTripStates.map((item) => item.state)));
  }

  const filtersChanged = Boolean(search) || selectedPackage !== "all" || visibleStates.size !== bookingTripStates.length;

  return (
    <div className="space-y-4">
      <BookingFilters
        search={search}
        onSearchChange={setSearch}
        packages={packageOptions}
        selectedPackage={selectedPackage}
        onPackageChange={setSelectedPackage}
        selectedStates={visibleStates}
        onStateToggle={toggleState}
        onReset={resetStates}
        resultCount={filteredBookings.length}
        totalCount={bookings.length}
      />

      {filteredBookings.length ? (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="p-4 font-medium">Booking</th><th className="p-4 font-medium">Package</th><th className="p-4 font-medium">Traveler</th><th className="p-4 font-medium">Source</th><th className="p-4 font-medium">Seats</th><th className="p-4 font-medium">Amount</th><th className="p-4 font-medium">Payment</th><th className="p-4 font-medium">Status</th><th className="p-4 text-right font-medium">Action</th></tr></thead>
              <tbody>{filteredBookings.map((booking) => (
                <tr key={booking._id} className="border-b border-border/50 align-top hover:bg-secondary/40">
                  <td className="p-4"><p className="font-mono text-xs">{booking.bookingNumber}</p><p className="text-xs text-muted-foreground">{formatDate(booking.createdAt)}</p></td>
                  <td className="p-4">{booking.trip?.title ?? "—"}</td>
                  <td className="p-4"><p className="font-medium">{booking.traveler?.name || booking.travelerDetails?.name}</p><p className="text-xs text-muted-foreground">{booking.travelerDetails?.mobile}</p></td>
                  <td className="p-4 text-muted-foreground">{booking.partner?.businessName ?? "Direct"}{booking.partner && booking.partnerEarnings ? <p className="text-xs">Comm: {formatINR(booking.partnerEarnings)}</p> : null}</td>
                  <td className="p-4">{booking.seats}</td>
                  <td className="p-4 font-medium">{formatINR(booking.totalAmount)}</td>
                  <td className="p-4"><StatusBadge status={booking.paymentStatus} /></td>
                  <td className="p-4"><BookingStatusSelect id={booking._id} status={booking.status} /></td>
                  <td className="p-4 text-right"><div className="flex items-center justify-end gap-1"><BookingRowActions id={booking._id} bookingNumber={booking.bookingNumber} /><EditBookingDrawer booking={booking} /></div></td>
                </tr>
              ))}</tbody>
            </table>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={search ? Search : CalendarCheck}
          title="No matching bookings"
          description={search ? `No bookings found for “${search}” with the selected package states.` : "No bookings match the selected package states."}
          action={filtersChanged ? <Button type="button" variant="outline" onClick={resetStates}>Reset filters</Button> : undefined}
        />
      )}
    </div>
  );
}

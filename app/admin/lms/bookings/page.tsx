import Link from "next/link";
import { CalendarCheck, CalendarDays, List } from "lucide-react";
import { AdminTripCalendar } from "@/components/admin/trip-calendar";
import { EmptyState } from "@/components/ui/empty-state";
import { ManualBookingDrawer } from "@/components/admin/manual-booking-drawer";
import { AdminBookingsList, type AdminBookingRow } from "@/components/admin/bookings-list";
import { listAdminBookings, listAdminBookableTrips, listAdminTrips } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

type BookingsView = "list" | "calendar";

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string | string[]; view?: string | string[]; q?: string | string[] }>;
}) {
  const params = await searchParams;
  const view: BookingsView = params.view === "calendar" ? "calendar" : "list";
  const country = typeof params.c === "string" ? params.c : undefined;
  const query = typeof params.q === "string" ? params.q.trim() : "";
  const viewHref = (nextView: BookingsView) => ({
    pathname: "/admin/lms/bookings",
    query: { ...(country ? { c: country } : {}), view: nextView, ...(query ? { q: query } : {}) },
  });
  const [bookings, bookableTrips, trips] = await Promise.all([
    listAdminBookings() as Promise<AdminBookingRow[]>,
    listAdminBookableTrips(),
    listAdminTrips(),
  ]);
  const fixedDepartureTrips = (trips as Array<{
    _id: string;
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    totalSeats: number;
    availableSeats: number;
    status?: string;
    holidayPackage?: boolean;
  }>).filter((trip) => trip.holidayPackage === false).map((trip) => ({
    ...trip,
    packageId: trip._id,
    source: "package" as const,
  }));
  const flexibleBookingTrips = bookings.flatMap((booking) => {
    if (booking.trip?.holidayPackage === false || !booking.trip || !booking.travelStartDate) return [];
    return [{
      _id: `booking-${booking._id}`,
      packageId: booking.trip._id,
      title: booking.trip.title,
      destination: booking.trip.destination,
      startDate: booking.travelStartDate,
      endDate: booking.travelEndDate || booking.travelStartDate,
      totalSeats: booking.seats,
      availableSeats: 0,
      status: booking.status,
      source: "booking" as const,
      bookingNumber: booking.bookingNumber,
      travelerName: booking.traveler?.name || booking.travelerDetails?.name,
    }];
  });
  const calendarTrips = [...fixedDepartureTrips, ...flexibleBookingTrips];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Bookings</h1>
          <p className="text-muted-foreground">{bookings.length} total</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-border bg-muted/50 p-1" aria-label="Bookings view">
            <Link
              href={viewHref("list")}
              aria-current={view === "list" ? "page" : undefined}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
                view === "list" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <List className="size-4" />
              List
            </Link>
            <Link
              href={viewHref("calendar")}
              aria-current={view === "calendar" ? "page" : undefined}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors",
                view === "calendar" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <CalendarDays className="size-4" />
              Calendar
            </Link>
          </div>
          <ManualBookingDrawer trips={bookableTrips as Parameters<typeof ManualBookingDrawer>[0]["trips"]} />
        </div>
      </div>

      {view === "calendar" ? (
        <AdminTripCalendar trips={calendarTrips} />
      ) : bookings.length ? (
        <AdminBookingsList bookings={bookings} query={query} />
      ) : (
        <EmptyState icon={CalendarCheck} title="No bookings yet" />
      )}
    </div>
  );
}

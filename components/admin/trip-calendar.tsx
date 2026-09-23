"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  BookingFilters,
  bookingTripStates,
  bookingTripStateStyles,
  getBookingTripState,
  type BookingTripState,
} from "@/components/admin/booking-trip-state-filter";

type CalendarTrip = {
  _id: string;
  packageId: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  totalSeats: number;
  availableSeats: number;
  status?: string;
  source: "package" | "booking";
  bookingNumber?: string;
  travelerName?: string;
};

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function dateKey(value: Date | string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthLabel(value: Date) {
  return value.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function tripDuration(trip: CalendarTrip) {
  const start = startOfDay(new Date(trip.startDate));
  const end = startOfDay(new Date(trip.endDate || trip.startDate));
  const millisecondsPerDay = 86_400_000;
  const total = Math.max(1, Math.round((end.getTime() - start.getTime()) / millisecondsPerDay) + 1);
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  const startLabel = start.toLocaleDateString("en-IN", sameMonth ? { day: "numeric" } : { day: "numeric", month: "short" });
  const endLabel = end.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  return {
    total,
    range: total === 1 ? endLabel : `${startLabel}–${endLabel}`,
  };
}

function calendarDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

type WeekSegment = {
  trip: CalendarTrip;
  startColumn: number;
  endColumn: number;
  lane: number;
  startsHere: boolean;
  endsHere: boolean;
};

function weekSegments(week: Date[], trips: CalendarTrip[]) {
  const weekStart = startOfDay(week[0]);
  const weekEnd = startOfDay(week[6]);
  const segments = trips
    .flatMap((trip) => {
      const tripStart = startOfDay(new Date(trip.startDate));
      const tripEndValue = startOfDay(new Date(trip.endDate || trip.startDate));
      const tripEnd = tripEndValue >= tripStart ? tripEndValue : tripStart;
      if (tripEnd < weekStart || tripStart > weekEnd) return [];
      const visibleStart = tripStart > weekStart ? tripStart : weekStart;
      const visibleEnd = tripEnd < weekEnd ? tripEnd : weekEnd;
      return [{
        trip,
        startColumn: Math.round((visibleStart.getTime() - weekStart.getTime()) / 86_400_000),
        endColumn: Math.round((visibleEnd.getTime() - weekStart.getTime()) / 86_400_000),
        lane: 0,
        startsHere: tripStart >= weekStart,
        endsHere: tripEnd <= weekEnd,
      } satisfies WeekSegment];
    })
    .sort((a, b) => a.startColumn - b.startColumn || b.endColumn - a.endColumn);

  const occupiedUntil: number[] = [];
  for (const segment of segments) {
    const openLane = occupiedUntil.findIndex((endColumn) => endColumn < segment.startColumn);
    segment.lane = openLane === -1 ? occupiedUntil.length : openLane;
    occupiedUntil[segment.lane] = segment.endColumn;
  }
  return { segments, laneCount: occupiedUntil.length };
}

export function AdminTripCalendar({ trips }: { trips: CalendarTrip[] }) {
  const [search, setSearch] = useState("");
  const [selectedPackage, setSelectedPackage] = useState("all");
  const [visibleStates, setVisibleStates] = useState<Set<BookingTripState>>(
    () => new Set(bookingTripStates.map((item) => item.state)),
  );
  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const today = useMemo(() => startOfDay(new Date()), []);
  const days = useMemo(() => calendarDays(month), [month]);
  const packageOptions = useMemo(() => Array.from(
    new Map(trips.map((trip) => [trip.packageId, { id: trip.packageId, title: trip.title, destination: trip.destination }])).values(),
  ), [trips]);
  const filteredTrips = useMemo(() => trips.filter((trip) => {
    if (selectedPackage !== "all" && trip.packageId !== selectedPackage) return false;
    const normalizedSearch = search.trim().toLocaleLowerCase();
    if (normalizedSearch && ![trip.title, trip.destination, trip.bookingNumber, trip.travelerName].some((value) => value?.toLocaleLowerCase().includes(normalizedSearch))) return false;
    return visibleStates.has(getBookingTripState(trip, today));
  }), [search, selectedPackage, trips, today, visibleStates]);
  const weeks = useMemo(() => Array.from({ length: 6 }, (_, index) => days.slice(index * 7, index * 7 + 7)), [days]);

  function moveMonth(delta: number) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  function toggleState(state: BookingTripState) {
    setVisibleStates((current) => {
      const next = new Set(current);
      if (next.has(state)) next.delete(state);
      else next.add(state);
      return next;
    });
  }

  function resetFilters() {
    setSearch("");
    setSelectedPackage("all");
    setVisibleStates(new Set(bookingTripStates.map((item) => item.state)));
  }

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
        onReset={resetFilters}
        resultCount={filteredTrips.length}
        totalCount={trips.length}
      />
      <Card>
      <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Package Calendar</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Date wise packages with booked and total seats</p>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="icon" onClick={() => moveMonth(-1)} aria-label="Previous month">
            <ChevronLeft className="size-4" />
          </Button>
          <div className="min-w-36 text-center text-sm font-semibold">{monthLabel(month)}</div>
          <Button type="button" variant="outline" size="icon" onClick={() => moveMonth(1)} aria-label="Next month">
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[980px] overflow-hidden rounded-lg border border-border">
            <div className="grid grid-cols-7 border-b border-border bg-secondary/60 text-xs font-semibold uppercase text-muted-foreground">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="px-3 py-2">{day}</div>
              ))}
            </div>
            <div>
              {weeks.map((week) => {
                const { segments, laneCount } = weekSegments(week, filteredTrips);
                const rowHeight = Math.max(150, 54 + laneCount * 62);
                return (
                  <div key={dateKey(week[0])} className="relative border-b border-border" style={{ height: rowHeight }}>
                    <div className="absolute inset-0 grid grid-cols-7">
                      {week.map((day) => {
                        const inMonth = day.getMonth() === month.getMonth();
                        const isToday = dateKey(day) === dateKey(today);
                        const activeCount = filteredTrips.filter((trip) => {
                          const start = startOfDay(new Date(trip.startDate));
                          const end = startOfDay(new Date(trip.endDate || trip.startDate));
                          return day >= start && day <= end;
                        }).length;
                        return (
                          <div key={dateKey(day)} className={cn("border-r border-border p-2", !inMonth && "bg-secondary/30 text-muted-foreground", isToday && "bg-primary/5")}>
                            <div className="flex items-center justify-between">
                              <span className={cn("flex size-7 items-center justify-center rounded-full text-xs font-semibold", isToday && "bg-primary text-primary-foreground")}>{day.getDate()}</span>
                              {activeCount ? <span className="text-[11px] text-muted-foreground">{activeCount} package{activeCount > 1 ? "s" : ""}</span> : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="pointer-events-none absolute inset-x-0 top-12 grid grid-cols-7 gap-y-2 px-1">
                      {segments.map((segment) => {
                        const trip = segment.trip;
                        const totalSeats = Number(trip.totalSeats || 0);
                        const bookedSeats = Math.max(0, totalSeats - Number(trip.availableSeats || 0));
                        const state = getBookingTripState(trip, today);
                        const duration = tripDuration(trip);
                        return (
                          <Link
                            key={`${trip._id}-${dateKey(week[0])}`}
                            href={trip.source === "booking" ? `/admin/lms/bookings?view=list&q=${encodeURIComponent(trip.bookingNumber || "")}` : `/admin/inventory/packages/${trip.packageId}/edit`}
                            className={cn(
                              "pointer-events-auto z-10 mx-1 min-w-0 border px-3 py-2 text-xs shadow-sm transition hover:z-20 hover:brightness-95",
                              segment.startsHere ? "rounded-l-xl" : "-ml-px border-l-0 rounded-l-none",
                              segment.endsHere ? "rounded-r-xl" : "-mr-px border-r-0 rounded-r-none",
                              bookingTripStateStyles[state],
                            )}
                            style={{
                              gridColumn: `${segment.startColumn + 1} / ${segment.endColumn + 2}`,
                              gridRow: segment.lane + 1,
                              minHeight: 54,
                            }}
                            title={`${trip.title}: ${duration.range}`}
                          >
                          {segment.startsHere ?<> <span className="flex items-center justify-between gap-2 font-semibold">
                             <span> <span className="truncate">{ trip.title}</span> - 
                            <span className=" truncate opacity-85">{trip.destination}</span>
                             </span>
                              <span className="shrink-0 rounded bg-white/60 px-2 py-0.5 text-[10px]">{duration.total} day{duration.total === 1 ? "" : "s"}</span>
                            </span>
                            {/* <span className="block truncate font-medium opacity-90">{duration.range}</span> */}
                            {trip.source === "booking" ? (
                              <span className="flex items-center justify-between gap-2">
                                <span className=" truncate opacity-85">{trip.travelerName || trip.bookingNumber} </span>
                                <span className=" font-medium">{trip.totalSeats} traveler{trip.totalSeats === 1 ? "" : "s"} · Booked</span>
                              </span>
                            ) : <span className=" font-medium">{bookedSeats}/{totalSeats} seats booked</span>}</> :<span className="truncate">Continues..</span>}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {!filteredTrips.length ? (
          <div className="mt-4 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {trips.length ? "No packages or bookings match the selected filters." : "Fixed departures and flexible-package bookings will appear in this calendar."}
          </div>
        ) : null}
      </CardContent>
      </Card>
    </div>
  );
}

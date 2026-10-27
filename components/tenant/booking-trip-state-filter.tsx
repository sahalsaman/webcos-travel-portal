"use client";

import { cn } from "@/lib/utils";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Filter, RotateCcw, Search } from "lucide-react";

export type BookingTripState = "upcoming-open" | "upcoming-full" | "started" | "completed";

export const bookingTripStates = [
  { state: "upcoming-open" as const, label: "Coming, seats pending" },
  { state: "upcoming-full" as const, label: "Coming, seats full" },
  { state: "started" as const, label: "Package started" },
  { state: "completed" as const, label: "Package completed" },
];

export const bookingTripStateStyles: Record<BookingTripState, string> = {
  "upcoming-open": "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200",
  "upcoming-full": "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-100",
  started: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-100",
  completed: "border-green-200 bg-green-50 text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-100",
};

type DatedTrip = {
  startDate: string;
  endDate?: string;
  totalSeats?: number;
  availableSeats?: number;
};

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function getBookingTripState(trip: DatedTrip, today = startOfDay(new Date())): BookingTripState {
  const start = startOfDay(new Date(trip.startDate));
  const end = startOfDay(new Date(trip.endDate || trip.startDate));
  const totalSeats = Number(trip.totalSeats || 0);
  const availableSeats = Number(trip.availableSeats || 0);
  const bookedSeats = Math.max(0, totalSeats - availableSeats);

  if (end < today) return "completed";
  if (start <= today && end >= today) return "started";
  return bookedSeats >= totalSeats && totalSeats > 0 ? "upcoming-full" : "upcoming-open";
}

export function BookingTripStateFilter({
  selected,
  onToggle,
  className,
}: {
  selected: ReadonlySet<BookingTripState>;
  onToggle: (state: BookingTripState) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)} aria-label="Filter bookings by package state">
      {bookingTripStates.map((item) => (
        <label
          key={item.state}
          className={cn(
            "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-opacity",
            bookingTripStateStyles[item.state],
            !selected.has(item.state) && "opacity-45 grayscale",
          )}
        >
          <input
            type="checkbox"
            checked={selected.has(item.state)}
            onChange={() => onToggle(item.state)}
            className="size-3.5 cursor-pointer accent-current"
          />
          {item.label}
        </label>
      ))}
    </div>
  );
}

export type BookingPackageOption = { id: string; title: string; destination: string };

export function BookingPackageFilter({ packages, value, onChange, ariaLabel = "Filter bookings by package" }: {
  packages: BookingPackageOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
}) {
  return (
    <Select value={value} onChange={(event) => onChange(event.target.value)} aria-label={ariaLabel}>
      <option value="all">All packages ({packages.length})</option>
      {packages.map((item) => <option key={item.id} value={item.id}>{item.title} — {item.destination}</option>)}
    </Select>
  );
}

export function BookingFilters({
  search,
  onSearchChange,
  packages,
  selectedPackage,
  onPackageChange,
  selectedStates,
  onStateToggle,
  onReset,
  resultCount,
  totalCount,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  packages: BookingPackageOption[];
  selectedPackage: string;
  onPackageChange: (value: string) => void;
  selectedStates: ReadonlySet<BookingTripState>;
  onStateToggle: (state: BookingTripState) => void;
  onReset: () => void;
  resultCount: number;
  totalCount: number;
}) {
  const changed = Boolean(search) || selectedPackage !== "all" || selectedStates.size !== bookingTripStates.length;

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex items-center gap-2 text-sm font-semibold"><Filter className="size-4 text-primary" />Filters</div>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search booking ID, package, destination or traveler" className="pl-9" aria-label="Search bookings" />
          </div>
          <div className="w-full lg:w-80">
            <BookingPackageFilter packages={packages} value={selectedPackage} onChange={onPackageChange} />
          </div>
          <p className="shrink-0 text-sm text-muted-foreground">Showing {resultCount} of {totalCount}</p>
          {changed ? <Button type="button" variant="ghost" size="sm" onClick={onReset}><RotateCcw className="size-4" />Reset</Button> : null}
        </div>
        <BookingTripStateFilter selected={selectedStates} onToggle={onStateToggle} />
      </CardContent>
    </Card>
  );
}

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin, Star, Calendar, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PackageServiceIcons } from "@/components/trip/package-service-icons";
import { isCustomDateTripCategory, tripThemeLabel } from "@/lib/constants";
import { tripDuration, formatDate } from "@/lib/utils";
import { CurrencyPrice } from "@/components/currency/currency-price";
import type { TripDTO } from "@/types";
import { cn } from "@/lib/utils";

interface TripCardProps {
  trip: TripDTO;
  href?: string;
  /** Override the displayed "from" price (e.g. partner selling price). */
  priceOverride?: number;
  priceLabel?: string;
  view?: "grid" | "list";
}

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=70";

export function TripCard({ trip, href, priceOverride, priceLabel, view = "grid" }: TripCardProps) {
  const link = href ?? `/packages/${trip.slug}`;
  const img = trip.images?.[0] || FALLBACK_IMG;
  const customDate = trip.holidayPackage ?? isCustomDateTripCategory(trip.category);
  const { label: duration } = tripDuration(trip.startDate, trip.endDate, trip.durationDays || trip.itinerary?.length);
  const price = priceOverride ?? trip.basePrice;
  const soldOut = customDate ? false : trip.availableSeats <= 0;

  return (
    <Link
      href={link}
      className={cn(
        "group relative flex h-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-xl hover:shadow-primary/10",
        view === "list" ? "flex-col sm:flex-row" : "flex-col",
      )}
    >
      <div className={cn("relative aspect-[4/3] overflow-hidden", view === "list" && "sm:aspect-auto sm:min-h-64 sm:w-[38%] sm:shrink-0")}>
        <Image
          src={img}
          alt={trip.title}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge variant="glass">{tripThemeLabel(trip.category)}</Badge>
          <Badge variant="glass">{trip.packageType ?? "Standard"}</Badge>
          {trip.featured ? <Badge variant="accent">Featured</Badge> : null}
        </div>
        {soldOut ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Badge variant="destructive" className="text-sm">Sold Out</Badge>
          </div>
        ) : null}
        <div className="absolute bottom-3 right-3">
          <Badge variant="glass" className="font-semibold">
            <Star className="size-3 fill-warning text-warning" />
            {trip.rating > 0 ? trip.rating.toFixed(1) : "New"}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3.5 text-primary" />
          {trip.destination}
        </div>
        <h3 className="mt-1 line-clamp-2 font-semibold leading-snug group-hover:text-primary">
          {trip.title}
        </h3>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="size-3.5" /> {duration}
          </span>
          {!customDate ? (
            <span className="flex items-center gap-1">
              <Users className="size-3.5" />
              {soldOut ? "Waitlist" : `${trip.availableSeats} seats left`}
            </span>
          ) : null}
        </div>

        <PackageServiceIcons
          includedServices={trip.includedServices}
          inclusions={trip.inclusions}
          compact
          className="mt-3"
        />

        <div className="mt-4 flex items-end justify-between border-t border-border pt-3">
          <div>
            <p className="text-[11px] text-muted-foreground">
              {priceLabel ?? "Starting from"}
            </p>
            <p className="text-lg font-bold">
              <CurrencyPrice amount={price} />
              <span className="text-xs font-normal text-muted-foreground"> /person</span>
            </p>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {customDate ? "" : formatDate(trip.startDate)}
          </span>
        </div>
        <span
          className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-all group-hover:bg-primary/90 group-hover:shadow-md"
        >
          View details
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

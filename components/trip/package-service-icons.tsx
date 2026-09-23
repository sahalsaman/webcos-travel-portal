import {
  Binoculars,
  BusFront,
  FileCheck2,
  Hotel,
  Plane,
  ShieldCheck,
  Utensils,
  UserRoundCheck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PACKAGE_SERVICES, PACKAGE_SERVICE_LABELS, type PackageService } from "@/lib/constants";

const SERVICE_DETAILS: Record<PackageService, { label: string; icon: LucideIcon; pattern: RegExp }> = {
  flights: { label: PACKAGE_SERVICE_LABELS.flights, icon: Plane, pattern: /\b(flights?|airfare|air tickets?)\b/i },
  hotels: { label: PACKAGE_SERVICE_LABELS.hotels, icon: Hotel, pattern: /\b(hotels?|accommodation|stays?)\b/i },
  sightseeing: { label: PACKAGE_SERVICE_LABELS.sightseeing, icon: Binoculars, pattern: /\b(sightseeing|excursions?|attractions?)\b/i },
  visa: { label: PACKAGE_SERVICE_LABELS.visa, icon: FileCheck2, pattern: /\bvisa\b/i },
  meals: { label: PACKAGE_SERVICE_LABELS.meals, icon: Utensils, pattern: /\b(meals?|breakfast|lunch|dinner)\b/i },
  "tour-manager": { label: PACKAGE_SERVICE_LABELS["tour-manager"], icon: UserRoundCheck, pattern: /\b(tour manager|trip captain|tour guide|guide)\b/i },
  transfers: { label: PACKAGE_SERVICE_LABELS.transfers, icon: BusFront, pattern: /\b(transfers?|transport|cab|vehicle)\b/i },
  "travel-insurance": { label: PACKAGE_SERVICE_LABELS["travel-insurance"], icon: ShieldCheck, pattern: /\b(travel insurance|insurance)\b/i },
};

export function resolveIncludedServices(includedServices: PackageService[] = [], inclusions: string[] = []) {
  const selected = new Set<PackageService>(includedServices);
  const inclusionText = inclusions.join(" ");
  for (const service of PACKAGE_SERVICES) {
    if (SERVICE_DETAILS[service].pattern.test(inclusionText)) selected.add(service);
  }
  return PACKAGE_SERVICES.filter((service) => selected.has(service));
}

export function PackageServiceIcons({
  includedServices,
  inclusions,
  compact = false,
  showcase = false,
  className,
}: {
  includedServices?: PackageService[];
  inclusions?: string[];
  compact?: boolean;
  showcase?: boolean;
  className?: string;
}) {
  const services = resolveIncludedServices(includedServices, inclusions);
  if (!services.length) return null;
  const visible = compact ? services.slice(0, 6) : services;

  return (
    <div className={cn(compact ? "flex flex-wrap gap-2" : showcase ? "flex flex-wrap gap-x-7 gap-y-4 sm:gap-x-10" : "grid grid-cols-2 gap-3 sm:grid-cols-4", className)}>
      {visible.map((service) => {
        const { label, icon: Icon } = SERVICE_DETAILS[service];
        return compact ? (
          <span key={service} title={label} aria-label={label} className="flex size-8 items-center justify-center rounded-lg bg-primary/8 text-primary ring-1 ring-primary/10">
            <Icon className="size-4" />
          </span>
        ) : showcase ? (
          <div key={service} className="flex min-w-16 flex-col items-center gap-2 text-center">
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-6" /></span>
            <span className="text-xs font-bold text-slate-700">{label}</span>
          </div>
        ) : (
          <div key={service} className="flex items-center gap-3 rounded-xl border border-border/70 bg-card p-3 shadow-sm">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="size-5" /></span>
            <span className="text-sm font-semibold">{label}</span>
          </div>
        );
      })}
      {compact && services.length > visible.length ? <span className="flex h-8 items-center rounded-lg bg-secondary px-2 text-xs font-semibold">+{services.length - visible.length}</span> : null}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { COUNTRY_OPTIONS, PACKAGE_SERVICES, PACKAGE_SERVICE_LABELS, PACKAGE_TYPES, TRIP_CATEGORIES, TRIP_STATUSES, tripThemeLabel, type PackageService, type PackageType, type TripCategory } from "@/lib/constants";
import { resolveIncludedServices } from "@/components/trip/package-service-icons";
import { emptyItineraryDay, ItineraryEditor, normalizeItineraryDay } from "@/components/admin/itinerary-editor";
import type { DestinationDTO, ItineraryItem, TripDTO } from "@/types";

function toDateInput(d?: string) {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

function dateToInput(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function todayInput() {
  return dateToInput(new Date());
}

function initialDurationDays(trip?: TripDTO) {
  if (!trip) return 3;
  if (trip.durationDays) return trip.durationDays;
  if (trip.itinerary.length) return trip.itinerary.length;
  return Math.max(1, Math.round((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 86_400_000) + 1);
}

function RequiredMark() {
  return <span className="text-destructive">*</span>;
}

function normalizeTripCategory(category?: string): TripCategory {
  const legacy: Record<string, TripCategory> = {
    Adventure: "Holiday Package",
    Group: "Group Trip",
    Luxury: "Holiday Package",
    "Wellness & spa": "Wellness",
  };

  if (category && (TRIP_CATEGORIES as readonly string[]).includes(category)) {
    return category as TripCategory;
  }
  return legacy[category ?? ""] ?? "Holiday Package";
}

export function TripForm({ trip, destinations = [] }: { trip?: TripDTO; destinations?: DestinationDTO[] }) {
  const router = useRouter();
  const editing = Boolean(trip);
  const [loading, setLoading] = useState(false);
  const initialCountry = trip?.country
    ?? destinations.find((destination) => destination.title === trip?.destination)?.country
    ?? "India";

  const [form, setForm] = useState({
    title: trip?.title ?? "",
    destination: trip?.destination ?? destinations.find((destination) => destination.country === initialCountry)?.title ?? "",
    country: initialCountry,
    description: trip?.description ?? "",
    basePrice: trip?.basePrice ?? 0,
    totalSeats: trip?.totalSeats ?? 0,
    availableSeats: trip?.availableSeats ?? 0,
    startDate: toDateInput(trip?.startDate),
    endDate: toDateInput(trip?.endDate),
    pickupLocation: trip?.pickupLocation ?? "",
    departureCities: (trip?.departureCities ?? []).join("\n"),
    category: normalizeTripCategory(trip?.category),
    packageType: trip?.packageType ?? "Standard" as PackageType,
    status: trip?.status ?? "draft",
    featured: trip?.featured ?? false,
    images: (trip?.images ?? []).join("\n"),
    inclusions: (trip?.inclusions ?? []).join("\n"),
    includedServices: resolveIncludedServices(trip?.includedServices, trip?.inclusions),
    exclusions: (trip?.exclusions ?? []).join("\n"),
    tags: (trip?.tags ?? []).join(", "),
    holidayPackage: trip?.holidayPackage ?? true,
    visaRequired: trip?.visaRequired ?? false,
    visaNote: trip?.visaNote ?? "",
    visaDocuments: (trip?.visaDocuments ?? []).join("\n"),
    visaFee: trip?.visaFee ?? 0,
    permitRequired: trip?.permitRequired ?? false,
    permitNote: trip?.permitNote ?? "",
    permitDocuments: (trip?.permitDocuments ?? []).join("\n"),
    permitFee: trip?.permitFee ?? 0,
  });
  const [itinerary, setItinerary] = useState<ItineraryItem[]>(
    trip?.itinerary?.length
      ? trip.itinerary.map(normalizeItineraryDay)
      : [emptyItineraryDay(1)],
  );
  const savedDurationDays = initialDurationDays(trip);
  const [packageDuration, setPackageDuration] = useState(
    `${savedDurationDays}D/${savedDurationDays - 1}N`,
  );
  // `holidayPackage` is a legacy field where true means a flexible/custom-date
  // package. Keep the persisted shape compatible while presenting the clearer
  // fixed-departure choice in the form.
  const fixedDeparture = !form.holidayPackage;
  const showDateAndSeats = fixedDeparture;
  const countryDestinations = destinations.filter((destination) => destination.country === form.country);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function onDestinationChange(value: string) {
    const destination = destinations.find((item) => item.title === value);
    setForm((current) => ({
      ...current,
      destination: value,
      country: destination?.country ?? current.country,
    }));
  }

  function onCountryChange(country: string) {
    const destinationsForCountry = destinations.filter((destination) => destination.country === country);
    setForm((current) => ({
      ...current,
      country,
      destination: destinationsForCountry.some((destination) => destination.title === current.destination)
        ? current.destination
        : destinationsForCountry[0]?.title ?? "",
    }));
  }

  function toggleIncludedService(service: PackageService) {
    setForm((current) => ({
      ...current,
      includedServices: current.includedServices.includes(service)
        ? current.includedServices.filter((item) => item !== service)
        : [...current.includedServices, service],
    }));
  }

  const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const durationMatch = packageDuration.trim().match(/^(\d+)\s*D\s*\/\s*(\d+)\s*N$/i);
    if (!durationMatch || Number(durationMatch[1]) < 1 || Number(durationMatch[2]) !== Number(durationMatch[1]) - 1) {
      toast.error("Enter duration in the format 3D/2N.");
      return;
    }
    setLoading(true);
    const startDate = showDateAndSeats ? form.startDate : form.startDate || todayInput();
    const endDate = showDateAndSeats ? form.endDate : form.endDate || startDate;
    const totalSeats = showDateAndSeats ? Number(form.totalSeats) : 999;
    const availableSeats = showDateAndSeats ? Number(form.availableSeats) || totalSeats : 999;
    const payload = {
      title: form.title,
      destination: form.destination,
      country: form.country,
      description: form.description,
      basePrice: Number(form.basePrice),
      durationDays: Number(durationMatch[1]),
      totalSeats,
      availableSeats,
      startDate,
      endDate,
      pickupLocation: form.pickupLocation,
      departureCities: lines(form.departureCities),
      category: form.category,
      packageType: form.packageType,
      status: form.status,
      featured: form.featured,
      images: lines(form.images),
      inclusions: lines(form.inclusions),
      includedServices: form.includedServices,
      exclusions: lines(form.exclusions),
      holidayPackage: form.holidayPackage,
      visaRequired: form.visaRequired,
      visaNote: form.visaNote,
      visaDocuments: lines(form.visaDocuments),
      visaFee: Number(form.visaFee),
      permitRequired: form.permitRequired,
      permitNote: form.permitNote,
      permitDocuments: lines(form.permitDocuments),
      permitFee: Number(form.permitFee),
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      itinerary: itinerary
        .filter((i) => i.title)
        .map((i, idx) => ({ ...i, day: idx + 1 })),
    };

    try {
      const res = await fetch(
        editing ? `/api/packages/${trip!._id}` : "/api/packages",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Save failed");
      toast.success(editing ? "Package updated" : "Package created");
      router.push("/admin/inventory/packages");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Card>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Package name <RequiredMark /></Label>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} required />
          </div>
             <div>
              <Label className="mb-1.5 block">Duration <RequiredMark /></Label>
              <Input
                placeholder="3D/2N"
                value={packageDuration}
                onChange={(e) => setPackageDuration(e.target.value)}
                required
              />
            </div>
          <div>
            <Label className="mb-1.5 block">Country <RequiredMark /></Label>
            <Select value={form.country} onChange={(e) => onCountryChange(e.target.value)} required>
              {COUNTRY_OPTIONS.map((country) => <option key={country.code} value={country.name}>{country.name}</option>)}
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">Destination <RequiredMark /></Label>
            <Select value={form.destination} onChange={(e) => onDestinationChange(e.target.value)} required>
              {form.destination && !countryDestinations.some((destination) => destination.title === form.destination) ? (
                <option value={form.destination}>{form.destination} (Saved)</option>
              ) : null}
              {!countryDestinations.length ? <option value="">No destinations available</option> : null}
              {countryDestinations.map((destination) => (
                <option key={destination._id} value={destination.title}>
                  {destination.title}{destination.status === "inactive" ? " (Inactive)" : ""}
                </option>
              ))}
            </Select>
          </div>
            <div>
              <Label className="mb-1.5 block">Price (₹) <RequiredMark /></Label>
              <Input
                type="number"
                min={0}
                value={form.basePrice}
                onChange={(e) => set("basePrice", Number(e.target.value))}
                required
              />
            </div>
          <div>
            <Label className="mb-1.5 block">Pickup location</Label>
            <Input value={form.pickupLocation} onChange={(e) => set("pickupLocation", e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block">Theme</Label>
            <Select value={form.category} onChange={(e) => set("category", e.target.value as typeof form.category)}>
              {TRIP_CATEGORIES.map((c) => <option key={c} value={c}>{tripThemeLabel(c)}</option>)}
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">Category</Label>
            <Select value={form.packageType} onChange={(e) => set("packageType", e.target.value as PackageType)}>
              {PACKAGE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">Status</Label>
            <Select value={form.status} onChange={(e) => set("status", e.target.value as typeof form.status)}>
              {TRIP_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
          <div>
            <Label className="mb-1.5 block">Tags (comma separated)</Label>
            <Input value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="beach, luxury" />
          </div>
          <div className="flex items-center sm:pt-5">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => set("featured", e.target.checked)}
                className="size-4 accent-[var(--primary)]"
              />
              Featured package
            </label>
          </div>
          {form.country !== "India" ? <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Departure cities <RequiredMark /></Label>
            <Textarea value={form.departureCities} onChange={(e) => set("departureCities", e.target.value)} placeholder={"Delhi\nMumbai\nKochi"} className="min-h-24" required />
            <p className="mt-1 text-xs text-muted-foreground">Add one departure city per line. These cities appear in the customer booking dropdown.</p>
          </div> : null}
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="min-h-28"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-6 p-6 lg:grid-cols-2">
          <RequirementFields kind="Visa" country={form.country} enabled={form.visaRequired} note={form.visaNote} documents={form.visaDocuments} fee={form.visaFee} onEnabled={(value)=>set("visaRequired",value)} onNote={(value)=>set("visaNote",value)} onDocuments={(value)=>set("visaDocuments",value)} onFee={(value)=>set("visaFee",value)}/>
          <RequirementFields kind="Permit" country={form.country} enabled={form.permitRequired} note={form.permitNote} documents={form.permitDocuments} fee={form.permitFee} onEnabled={(value)=>set("permitRequired",value)} onNote={(value)=>set("permitNote",value)} onDocuments={(value)=>set("permitDocuments",value)} onFee={(value)=>set("permitFee",value)}/>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
 
          <div className="flex items-center sm:pt-5 sm:col-span-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={fixedDeparture}
                onChange={(e) => set("holidayPackage", !e.target.checked)}
                className="size-4 accent-[var(--primary)]"
              />
              Fixed Departures
            </label>
          </div>
          {showDateAndSeats ? (
            <>
              <div>
                <Label className="mb-1.5 block">Total seats <RequiredMark /></Label>
                <Input type="number" min={1} value={form.totalSeats} onChange={(e) => set("totalSeats", Number(e.target.value))} required />
              </div>
              <div>
                <Label className="mb-1.5 block">Available seats <RequiredMark /></Label>
                <Input type="number" min={0} value={form.availableSeats} onChange={(e) => set("availableSeats", Number(e.target.value))} required />
              </div>
              <div>
                <Label className="mb-1.5 block">Start date <RequiredMark /></Label>
                <Input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} required />
              </div>
              <div>
                <Label className="mb-1.5 block">End date <RequiredMark /></Label>
                <Input type="date" min={form.startDate || undefined} value={form.endDate} onChange={(e) => set("endDate", e.target.value)} required />
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4 text-sm text-muted-foreground sm:col-span-2">
              <p className="font-medium text-foreground">Flexible departure</p>
              <p className="mt-1">Leave Fixed Departures unchecked when customers can choose their travel date. Dates and seats will be handled per enquiry.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-5 p-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Package includes</Label>
            <p className="mb-3 text-xs text-muted-foreground">Select the services included in this package. They will appear with icons on the website.</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {PACKAGE_SERVICES.map((service) => (
                <label key={service} className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary/50 has-checked:border-primary/40 has-checked:bg-primary/5">
                  <input
                    type="checkbox"
                    checked={form.includedServices.includes(service)}
                    onChange={() => toggleIncludedService(service)}
                    className="size-4 accent-[var(--primary)]"
                  />
                  {PACKAGE_SERVICE_LABELS[service]}
                </label>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block">Image URLs (one per line)</Label>
            <Textarea
              value={form.images}
              onChange={(e) => set("images", e.target.value)}
              className="min-h-24 font-mono text-xs"
              placeholder="https://res.cloudinary.com/...&#10;https://images.unsplash.com/..."
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Paste Cloudinary/Unsplash URLs. (Cloudinary upload widget can be wired via the configured preset.)
            </p>
          </div>
          <div>
            <Label className="mb-1.5 block">Inclusions (one per line)</Label>
            <Textarea value={form.inclusions} onChange={(e) => set("inclusions", e.target.value)} className="min-h-28" />
          </div>
          <div>
            <Label className="mb-1.5 block">Exclusions (one per line)</Label>
            <Textarea value={form.exclusions} onChange={(e) => set("exclusions", e.target.value)} className="min-h-28" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6"><ItineraryEditor value={itinerary} onChange={setItinerary} /></CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" variant="gradient" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          {editing ? "Save changes" : "Create package"}
        </Button>
      </div>
    </form>
  );
}

function RequirementFields({kind,country,enabled,note,documents,fee,onEnabled,onNote,onDocuments,onFee}:{kind:"Visa"|"Permit";country:string;enabled:boolean;note:string;documents:string;fee:number;onEnabled:(value:boolean)=>void;onNote:(value:string)=>void;onDocuments:(value:string)=>void;onFee:(value:number)=>void}){return <section className="space-y-4 rounded-xl border p-4"><label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={enabled} onChange={(event)=>onEnabled(event.target.checked)} className="size-4 accent-[var(--primary)]"/>{kind} mandatory for {country}</label>{enabled&&<><div><Label className="mb-1.5 block">{kind} fee per traveler (₹)</Label><Input type="number" min={0} step={1} value={fee} onChange={(event)=>onFee(Number(event.target.value))}/><p className="mt-1 text-xs text-muted-foreground">Applied when the traveler selects No.</p></div><div><Label className="mb-1.5 block">Note shown to travelers</Label><Textarea value={note} onChange={(event)=>onNote(event.target.value)} placeholder={`Explain the ${kind.toLowerCase()} requirement and next steps.`} required className="min-h-20"/></div><div><Label className="mb-1.5 block">Required documents (one per line)</Label><Textarea value={documents} onChange={(event)=>onDocuments(event.target.value)} placeholder={kind==="Visa"?"Passport copy\nPassport-size photo\nBank statement":"Passport copy\nExisting visa copy\nApplication form"} required className="min-h-28"/><p className="mt-1 text-xs text-muted-foreground">Travelers who answer No must upload every listed document.</p></div></>}</section>}

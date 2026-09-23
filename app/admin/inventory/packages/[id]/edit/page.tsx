import { notFound } from "next/navigation";
import { TripForm } from "@/components/admin/trip-form";
import { getAdminTripById, listAdminDestinations } from "@/lib/dashboard";
import type { DestinationDTO, TripDTO } from "@/types";

export default async function EditPackagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [trip, destinations] = await Promise.all([
    getAdminTripById(id) as Promise<TripDTO | null>,
    listAdminDestinations() as Promise<DestinationDTO[]>,
  ]);
  if (!trip) notFound();
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold">Edit Package</h1><p className="text-muted-foreground">{trip.title}</p></div><TripForm trip={trip} destinations={destinations} /></div>;
}

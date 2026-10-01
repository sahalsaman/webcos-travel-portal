import { notFound } from "next/navigation";
import { TripForm } from "@/components/admin/trip-form";
import { getAdminTripById, listAdminDestinations, listAdminInventoryAssets, listAdminSuppliers } from "@/lib/dashboard";
import type { DestinationDTO, InventoryAssetDTO, SupplierDTO, TripDTO } from "@/types";

export default async function EditPackagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [trip, destinations, suppliers, hotels, vehicles] = await Promise.all([
    getAdminTripById(id) as Promise<TripDTO | null>,
    listAdminDestinations() as Promise<DestinationDTO[]>,
    listAdminSuppliers() as Promise<SupplierDTO[]>,
    listAdminInventoryAssets("hotel") as Promise<InventoryAssetDTO[]>,
    listAdminInventoryAssets("vehicle") as Promise<InventoryAssetDTO[]>,
  ]);
  if (!trip) notFound();
  return <div className="space-y-6"><div><h1 className="text-2xl font-bold">Edit Package</h1><p className="text-muted-foreground">{trip.title}</p></div><TripForm trip={trip} destinations={destinations} suppliers={suppliers} hotels={hotels} vehicles={vehicles} /></div>;
}

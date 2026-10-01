import { TripForm } from "@/components/admin/trip-form";
import { listAdminDestinations, listAdminInventoryAssets, listAdminSuppliers } from "@/lib/dashboard";
import type { DestinationDTO, InventoryAssetDTO, SupplierDTO } from "@/types";

export default async function NewItineraryPage() {
  const [destinations, suppliers, hotels, vehicles] = await Promise.all([listAdminDestinations() as Promise<DestinationDTO[]>, listAdminSuppliers() as Promise<SupplierDTO[]>, listAdminInventoryAssets("hotel") as Promise<InventoryAssetDTO[]>, listAdminInventoryAssets("vehicle") as Promise<InventoryAssetDTO[]>]);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Package</h1>
        <p className="text-muted-foreground">Create a scheduled or flexible travel Package</p>
      </div>
      <TripForm destinations={destinations} suppliers={suppliers} hotels={hotels} vehicles={vehicles} />
    </div>
  );
}

import { TripForm } from "@/components/trip-form";
import { listTenantDestinations, listTenantInventoryAssets, listTenantSuppliers } from "@/lib/dashboard";
import type { DestinationDTO, InventoryAssetDTO, SupplierDTO } from "@/types";

export default async function NewItineraryPage() {
  const [destinations, suppliers, hotels, vehicles] = await Promise.all([listTenantDestinations() as Promise<DestinationDTO[]>, listTenantSuppliers() as Promise<SupplierDTO[]>, listTenantInventoryAssets("hotel") as Promise<InventoryAssetDTO[]>, listTenantInventoryAssets("vehicle") as Promise<InventoryAssetDTO[]>]);
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

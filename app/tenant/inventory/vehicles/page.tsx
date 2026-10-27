import { InventoryAssetManager } from "@/components/tenant/inventory-asset-manager";
import { listTenantInventoryAssets, listTenantSuppliers } from "@/lib/dashboard";
import type { InventoryAssetDTO, SupplierDTO } from "@/types";
export default async function VehiclesPage() { const [items, suppliers] = await Promise.all([listTenantInventoryAssets("vehicle"), listTenantSuppliers()]); return <InventoryAssetManager items={items as InventoryAssetDTO[]} suppliers={suppliers as SupplierDTO[]} kind="vehicle" />; }

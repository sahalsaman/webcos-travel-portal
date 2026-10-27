import { InventoryAssetManager } from "@/components/tenant/inventory-asset-manager";
import { listTenantInventoryAssets, listTenantSuppliers } from "@/lib/dashboard";
import type { InventoryAssetDTO, SupplierDTO } from "@/types";
export default async function HotelsPage() { const [items, suppliers] = await Promise.all([listTenantInventoryAssets("hotel"), listTenantSuppliers()]); return <InventoryAssetManager items={items as InventoryAssetDTO[]} suppliers={suppliers as SupplierDTO[]} kind="hotel" />; }

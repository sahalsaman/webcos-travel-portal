import { InventoryAssetManager } from "@/components/admin/inventory-asset-manager";
import { listAdminInventoryAssets, listAdminSuppliers } from "@/lib/dashboard";
import type { InventoryAssetDTO, SupplierDTO } from "@/types";
export default async function HotelsPage() { const [items, suppliers] = await Promise.all([listAdminInventoryAssets("hotel"), listAdminSuppliers()]); return <InventoryAssetManager items={items as InventoryAssetDTO[]} suppliers={suppliers as SupplierDTO[]} kind="hotel" />; }

import { InventorySuppliers } from "@/components/admin/inventory-suppliers";
import { listAdminSuppliers } from "@/lib/dashboard";
import type { SupplierDTO } from "@/types";
export default async function HotelsPage() { const supplierOptions = await listAdminSuppliers() as SupplierDTO[]; const suppliers = supplierOptions.filter((item) => item.type === "Hotel"); return <InventorySuppliers suppliers={suppliers} supplierOptions={supplierOptions} kind="Hotel" />; }

import { InventorySuppliers } from "@/components/admin/inventory-suppliers";
import { listAdminSuppliers } from "@/lib/dashboard";
import type { SupplierDTO } from "@/types";
export default async function VehiclesPage() { const supplierOptions = await listAdminSuppliers() as SupplierDTO[]; const suppliers = supplierOptions.filter((item) => item.type === "Transport"); return <InventorySuppliers suppliers={suppliers} supplierOptions={supplierOptions} kind="Transport" />; }

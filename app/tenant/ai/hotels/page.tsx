import { AiInventoryGenerator } from "@/components/tenant/ai-inventory-generator";
import { listTenantSuppliers } from "@/lib/dashboard";
import type { SupplierDTO } from "@/types";
export default async function GenerateHotels() { return <AiInventoryGenerator kind="hotel" suppliers={await listTenantSuppliers() as SupplierDTO[]} />; }

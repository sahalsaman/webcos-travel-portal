import { AiPackageImport } from "@/components/tenant/browser-package-import";
import { listTenantDestinations, listTenantSuppliers } from "@/lib/dashboard";
import type { DestinationDTO, SupplierDTO } from "@/types";
export default async function GeneratePackages() { const [destinations, suppliers] = await Promise.all([listTenantDestinations() as Promise<DestinationDTO[]>, listTenantSuppliers() as Promise<SupplierDTO[]>]); return <AiPackageImport destinations={destinations} suppliers={suppliers} />; }

import { BrowserPackageImport } from "@/components/admin/browser-package-import";
import { listAdminDestinations, listAdminSuppliers } from "@/lib/dashboard";
import type { DestinationDTO, SupplierDTO } from "@/types";

export default async function ImportPackagePage() {
  const [destinations, suppliers] = await Promise.all([listAdminDestinations() as Promise<DestinationDTO[]>, listAdminSuppliers() as Promise<SupplierDTO[]>]);
  return <BrowserPackageImport destinations={destinations} suppliers={suppliers} />;
}

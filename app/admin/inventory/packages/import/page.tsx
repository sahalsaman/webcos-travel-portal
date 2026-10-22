import { BrowserPackageImport } from "@/components/admin/browser-package-import";
import { listAdminDestinations } from "@/lib/dashboard";
import type { DestinationDTO } from "@/types";

export default async function ImportPackagePage() {
  const destinations = await listAdminDestinations() as DestinationDTO[];
  return <BrowserPackageImport destinations={destinations} />;
}

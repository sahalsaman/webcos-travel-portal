import { TripForm } from "@/components/admin/trip-form";
import { listAdminDestinations } from "@/lib/dashboard";
import type { DestinationDTO } from "@/types";

export default async function NewItineraryPage() {
  const destinations = (await listAdminDestinations()) as DestinationDTO[];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Package</h1>
        <p className="text-muted-foreground">Create a scheduled or flexible travel Package</p>
      </div>
      <TripForm destinations={destinations} />
    </div>
  );
}

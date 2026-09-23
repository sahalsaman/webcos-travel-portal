import { Users } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { AddTravelerDrawer } from "@/components/admin/add-traveler-drawer";
import { TravelerDetailDrawer } from "@/components/admin/traveler-detail-drawer";
import { listAdminTravelers, listAdminTrips } from "@/lib/dashboard";
import type { TripDTO, UserDTO } from "@/types";

export default async function CustomersPage() {
  const [travelers, itineraries] = await Promise.all([listAdminTravelers(), listAdminTrips() as Promise<TripDTO[]>]);
  return <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Customers</h2><p className="text-sm text-muted-foreground">{travelers.length} customers with booking history</p></div><AddTravelerDrawer /></div>{travelers.length ? <TravelerDetailDrawer travelers={travelers as Array<UserDTO & { bookingCount: number; paidAmount: number; lastBookingAt?: string | null; bookings: never[] }>} itineraries={itineraries} /> : <EmptyState icon={Users} title="No customers yet" />}</div>;
}

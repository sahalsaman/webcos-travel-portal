import { IndianRupee, CalendarCheck, Plane, Users } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CsvExportButton, PrintButton } from "@/components/admin/report-export";
import {
  getAdminStats,
  listAdminBookings,
  listAdminTrips,
  listAdminPartners,
} from "@/lib/dashboard";
import { formatINR, formatDate } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function ReportsPage() {
  const [stats, bookings, trips, partners] = await Promise.all([
    getAdminStats(),
    listAdminBookings(),
    listAdminTrips(),
    listAdminPartners(),
  ]);

  const bookingRows = (bookings as any[]).map((b) => ({
    Booking: b.bookingNumber,
    Package: b.trip?.title ?? "",
    Traveler: b.traveler?.name ?? "",
    Source: b.partner?.businessName ?? "Direct",
    Seats: b.seats,
    Amount: b.totalAmount,
    PartnerEarnings: b.partnerEarnings,
    Payment: b.paymentStatus,
    Status: b.status,
    Date: formatDate(b.createdAt),
  }));

  const tripRows = (trips as any[]).map((t) => ({
    Title: t.title,
    Destination: t.destination,
    Theme: t.category,
    BasePrice: t.basePrice,
    Seats: `${t.availableSeats}/${t.totalSeats}`,
    Status: t.status,
  }));

  const partnerRows = (partners as any[]).map((p) => ({
    Business: p.businessName,
    Type: p.partnerType,
    Email: p.user?.email ?? "",
    Status: p.status,
    TotalEarnings: p.totalEarnings,
    PendingEarnings: p.pendingEarnings,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground">Export revenue, bookings, packages & partners</p>
        </div>
        <PrintButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Gross Revenue" value={formatINR(stats.revenue)} icon={IndianRupee} accent="success" />
        <StatCard label="Bookings" value={stats.bookings} icon={CalendarCheck} accent="accent" />
        <StatCard label="Packages" value={stats.trips} icon={Plane} />
        <StatCard label="Partners" value={stats.partners} icon={Users} accent="warning" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export data (CSV / Excel)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <CsvExportButton rows={bookingRows} filename="bookings.csv" label="Revenue & Bookings" />
          <CsvExportButton rows={tripRows} filename="packages.csv" label="Packages" />
          <CsvExportButton rows={partnerRows} filename="partners.csv" label="Partners" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Booking report ({bookingRows.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-2 font-medium">Booking</th>
                <th className="p-2 font-medium">Package</th>
                <th className="p-2 font-medium">Source</th>
                <th className="p-2 font-medium">Amount</th>
                <th className="p-2 font-medium">Status</th>
                <th className="p-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {bookingRows.slice(0, 25).map((r, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="p-2 font-mono text-xs">{r.Booking}</td>
                  <td className="p-2">{r.Package}</td>
                  <td className="p-2 text-muted-foreground">{r.Source}</td>
                  <td className="p-2">{formatINR(Number(r.Amount))}</td>
                  <td className="p-2 capitalize">{r.Status}</td>
                  <td className="p-2 text-muted-foreground">{r.Date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

import Link from "next/link";
import {
  Plane,
  MapPin,
  CalendarCheck,
  IndianRupee,
  Users,
  UserCircle,
  Star,
  MessageSquareWarning,
  ContactRound,
  Boxes,
  Wallet,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { AreaTrendChart, BarRankChart } from "@/components/dashboard/charts";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { getAdminStats, getAdminCharts, getRecentBookings, getAdminReputationSummary } from "@/lib/dashboard";
import { formatINR, formatDate } from "@/lib/utils";

interface RecentBooking {
  _id: string;
  bookingNumber: string;
  trip?: { title: string };
  traveler?: { name: string };
  partner?: { businessName: string } | null;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export default async function AdminDashboard() {
  const [stats, charts, recent, reputation] = await Promise.all([
    getAdminStats(),
    getAdminCharts(),
    getRecentBookings(6),
    getAdminReputationSummary(),
  ]);
  const bookings = recent as RecentBooking[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Platform overview & analytics</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Destinations" value={stats.destinations} icon={MapPin} hint={`${stats.activeDestinations} active`} />
        <StatCard label="Packages" value={stats.trips} icon={Plane} hint={`${stats.activeTrips} active`} />
        <StatCard label="Bookings" value={stats.bookings} icon={CalendarCheck} accent="accent" />
        <StatCard label="Gross Revenue" value={formatINR(stats.revenue)} icon={IndianRupee} accent="success" hint={`${formatINR(stats.adminRevenue)} to operator`} />
        <StatCard label="Partners" value={stats.partners} icon={Users} accent="primary" />
        <StatCard label="Travelers" value={stats.travelers} icon={UserCircle} accent="warning" />
        <StatCard label="Average Rating" value={reputation.averageRating ? `${reputation.averageRating}/5` : "—"} icon={Star} accent="warning" hint={`${reputation.total} reviews tracked`} />
        <StatCard label="ORM Attention" value={reputation.unresolved} icon={MessageSquareWarning} accent="accent" hint={`${reputation.negative} negative open`} />
      </div>

      <Card><CardHeader><CardTitle>Operations workspace</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
        { href: "/admin/lms", label: "Leads & quotations", description: "Follow enquiries and prepare offers", icon: ContactRound },
        { href: "/admin/inventory", label: "Inventory", description: "Manage itineraries and suppliers", icon: Boxes },
        { href: "/admin/finance", label: "Finance", description: "Review earnings, expenses and invoices", icon: Wallet },
        { href: "/admin/reputation", label: "Reputation", description: "Respond to reviews and escalations", icon: Star },
      ].map((item) => <Link key={item.href} href={item.href} className="rounded-xl border border-border p-4 transition-colors hover:bg-secondary/50"><item.icon className="mb-3 size-5 text-primary"/><p className="font-semibold">{item.label}</p><p className="mt-1 text-xs text-muted-foreground">{item.description}</p></Link>)}</CardContent></Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <AreaTrendChart title="Booking Trends" data={charts.trend} xKey="month" yKey="bookings" />
        <AreaTrendChart title="Revenue Analytics" data={charts.trend} xKey="month" yKey="revenue" currency color="#00B6F0" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BarRankChart title="Top Selling Packages" data={charts.topTrips} xKey="name" yKey="bookings" />
        <BarRankChart title="Partner Performance" data={charts.topPartners} xKey="name" yKey="earnings" currency />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent Bookings</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/lms/bookings">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {bookings.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Booking</th>
                    <th className="pb-2 font-medium">Package</th>
                    <th className="pb-2 font-medium">Traveler</th>
                    <th className="pb-2 font-medium">Source</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b._id} className="border-b border-border/50">
                      <td className="py-3 font-mono text-xs">{b.bookingNumber}</td>
                      <td className="py-3">{b.trip?.title ?? "—"}</td>
                      <td className="py-3">{b.traveler?.name ?? "—"}</td>
                      <td className="py-3 text-muted-foreground">
                        {b.partner?.businessName ?? "Direct"}
                      </td>
                      <td className="py-3 font-medium">{formatINR(b.totalAmount)}</td>
                      <td className="py-3"><StatusBadge status={b.status} /></td>
                      <td className="py-3 text-muted-foreground">{formatDate(b.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={CalendarCheck}
              title="No bookings yet"
              description="Bookings will appear here once travelers start booking packages."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

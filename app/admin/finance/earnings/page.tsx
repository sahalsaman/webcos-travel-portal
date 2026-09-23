import { Landmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { listAdminEarnings } from "@/lib/dashboard";
import { formatDate, formatINR } from "@/lib/utils";

type EarningRow = { _id: string; bookingNumber: string; trip?: { title?: string; destination?: string }; partner?: { businessName?: string } | null; travelerDetails?: { name?: string }; totalAmount: number; adminEarnings: number; createdAt: string };

export default async function AdminEarningsPage() {
  const earnings = await listAdminEarnings() as EarningRow[];
  const total = earnings.reduce((sum, item) => sum + Number(item.adminEarnings || 0), 0);
  return <div className="space-y-5"><div><h2 className="text-xl font-bold">Admin Earnings</h2><p className="text-sm text-muted-foreground">Agency earnings from completed payment transactions.</p></div><div className="flex flex-wrap gap-x-8 gap-y-2 rounded-lg border border-border bg-secondary/30 px-4 py-3 text-sm"><p><span className="text-muted-foreground">Paid bookings:</span> <span className="font-bold">{earnings.length}</span></p><p><span className="text-muted-foreground">Total admin earnings:</span> <span className="font-bold text-primary">{formatINR(total)}</span></p></div>{earnings.length ? <Card><CardContent className="overflow-x-auto p-0"><table className="w-full min-w-[900px] text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-4">Booking</th><th className="p-4">Itinerary</th><th className="p-4">Customer</th><th className="p-4">Source</th><th className="p-4">Booking amount</th><th className="p-4">Admin earning</th><th className="p-4">Date</th></tr></thead><tbody>{earnings.map((item) => <tr key={item._id} className="border-b border-border/50 hover:bg-secondary/30"><td className="p-4 font-mono text-xs">{item.bookingNumber}</td><td className="p-4"><p className="font-medium">{item.trip?.title || "—"}</p><p className="text-xs text-muted-foreground">{item.trip?.destination}</p></td><td className="p-4">{item.travelerDetails?.name || "—"}</td><td className="p-4">{item.partner?.businessName || "Direct"}</td><td className="p-4">{formatINR(item.totalAmount)}</td><td className="p-4 font-bold text-primary">{formatINR(item.adminEarnings)}</td><td className="p-4 text-muted-foreground">{formatDate(item.createdAt)}</td></tr>)}</tbody></table></CardContent></Card> : <EmptyState icon={Landmark} title="No admin earnings yet" description="Paid booking earnings will appear here." />}</div>;
}

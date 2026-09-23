import { FileText } from "lucide-react";
import { QuotationDrawer } from "@/components/admin/quotation-drawer";
import { QuotationShareActions } from "@/components/admin/quotation-share-actions";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { listAdminLeads, listAdminQuotations, listAdminTravelers, listAdminTrips } from "@/lib/dashboard";
import { formatDate, formatINR } from "@/lib/utils";
import type { LeadDTO, QuotationDTO, TripDTO, UserDTO } from "@/types";

export default async function LmsQuotationsPage() {
  const [quotations, leads, customerRecords, itineraries] = await Promise.all([listAdminQuotations() as Promise<QuotationDTO[]>, listAdminLeads() as Promise<LeadDTO[]>, listAdminTravelers(), listAdminTrips() as Promise<TripDTO[]>]);
  const customers = customerRecords as unknown as UserDTO[];
  const drawer = (quotation?: QuotationDTO) => <QuotationDrawer quotation={quotation} leads={leads} customers={customers} itineraries={itineraries} />;
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Quotations</h2><p className="text-sm text-muted-foreground">{quotations.length} customer quotations</p></div>{drawer()}</div>
    {quotations.length ? <Card><CardContent className="overflow-x-auto p-0"><table className="w-full text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-4">Quotation</th><th className="p-4">Customer / Lead</th><th className="p-4">Valid until</th><th className="p-4">Amount</th><th className="p-4">Status</th><th className="p-4 text-right">Send</th><th className="p-4 text-right">Edit</th></tr></thead><tbody>{quotations.map((quotation) => { const lead = typeof quotation.lead === "object" ? quotation.lead : null; return <tr key={quotation._id} className="border-b border-border/50 hover:bg-secondary/40"><td className="p-4"><p className="font-mono text-xs">{quotation.quotationNumber}</p><p className="font-medium">{quotation.title}</p></td><td className="p-4"><p className="font-medium">{quotation.customerName}</p><p className="text-xs text-muted-foreground">{lead ? `${lead.leadNumber} · ` : ""}{quotation.customerPhone}</p></td><td className="p-4">{formatDate(quotation.validUntil)}</td><td className="p-4 font-bold">{formatINR(quotation.totalAmount)}</td><td className="p-4"><StatusBadge status={quotation.status} /></td><td className="p-4"><QuotationShareActions quotation={quotation} /></td><td className="p-4 text-right">{drawer(quotation)}</td></tr>; })}</tbody></table></CardContent></Card> : <EmptyState icon={FileText} title="No quotations yet" description="Create a customer-specific itinerary quotation." action={drawer()} />}
  </div>;
}

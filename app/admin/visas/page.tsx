import { Stamp } from "lucide-react";
import { VisaDrawer } from "@/components/admin/visa-drawer";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { listAdminLeads, listAdminTravelers, listAdminVisas } from "@/lib/dashboard";
import { formatDate } from "@/lib/utils";
import type { VisaApplicationDTO, UserDTO } from "@/types";

export default async function VisasPage() {
  const [visas, leads, customers] = await Promise.all([listAdminVisas() as Promise<VisaApplicationDTO[]>, listAdminLeads(), listAdminTravelers() as Promise<UserDTO[]>]);
  return <div className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-bold">Visa Tracking</h1><p className="text-muted-foreground">{visas.length} visa applications</p></div><VisaDrawer leads={leads} customers={customers} /></div>{visas.length ? <Card><CardContent className="overflow-x-auto p-0"><table className="w-full text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-4">Case</th><th className="p-4">Applicant</th><th className="p-4">Passport</th><th className="p-4">Destination / Type</th><th className="p-4">Timeline</th><th className="p-4">Status</th><th className="p-4 text-right">Action</th></tr></thead><tbody>{visas.map((visa) => <tr key={visa._id} className="border-b border-border/50 hover:bg-secondary/40"><td className="p-4"><p className="font-mono text-xs">{visa.visaNumber}</p><p className="text-xs text-muted-foreground">{visa.bookingNumber || "No booking linked"}</p></td><td className="p-4"><p className="font-medium">{visa.applicantName}</p><p className="text-xs text-muted-foreground">{visa.phone}</p></td><td className="p-4 font-mono text-xs">{visa.passportNumber}</td><td className="p-4"><p>{visa.destinationCountry}</p><p className="text-xs text-muted-foreground">{visa.visaType}</p></td><td className="p-4 text-xs"><p>Submitted: {visa.submittedAt ? formatDate(visa.submittedAt) : "—"}</p><p>Expected: {visa.expectedAt ? formatDate(visa.expectedAt) : "—"}</p></td><td className="p-4"><StatusBadge status={visa.status} /></td><td className="p-4 text-right"><VisaDrawer visa={visa} leads={leads} customers={customers} /></td></tr>)}</tbody></table></CardContent></Card> : <EmptyState icon={Stamp} title="No visa cases" description="Add a visa application to start tracking documents, submission, and approval." action={<VisaDrawer leads={leads} customers={customers} />} />}</div>;
}

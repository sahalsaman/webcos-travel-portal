import { Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { PartnerActions } from "@/components/admin/partner-actions";
import { PartnerInviteDrawer } from "@/components/admin/partner-invite-drawer";
import { listAdminPartners } from "@/lib/dashboard";
import { formatINR } from "@/lib/utils";

type Row = { _id: string; businessName: string; slug: string; partnerType: string; status: string; totalEarnings: number; pendingEarnings: number; user?: { name: string; email: string } };
export default async function PartnersPage() {
  const partners = await listAdminPartners() as Row[];
  return <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Partners</h2><p className="text-sm text-muted-foreground">{partners.length} invited or registered partners</p></div><PartnerInviteDrawer /></div>{partners.length ? <Card><CardContent className="overflow-x-auto p-0"><table className="w-full text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-4">Business</th><th className="p-4">Type</th><th className="p-4">Link</th><th className="p-4">Earnings</th><th className="p-4">Status</th><th className="p-4 text-right">Action</th></tr></thead><tbody>{partners.map((item) => <tr key={item._id} className="border-b border-border/50"><td className="p-4"><div className="flex items-center gap-3"><Avatar name={item.businessName} size={38} /><div><p className="font-medium">{item.businessName}</p><p className="text-xs text-muted-foreground">{item.user?.email}</p></div></div></td><td className="p-4">{item.partnerType}</td><td className="p-4 font-mono text-xs">/p/{item.slug}</td><td className="p-4"><p>{formatINR(item.totalEarnings)}</p><p className="text-xs text-muted-foreground">{formatINR(item.pendingEarnings)} pending</p></td><td className="p-4"><StatusBadge status={item.status} /></td><td className="p-4"><PartnerActions id={item._id} status={item.status} /></td></tr>)}</tbody></table></CardContent></Card> : <EmptyState icon={Users} title="No partners yet" action={<PartnerInviteDrawer />} />}</div>;
}

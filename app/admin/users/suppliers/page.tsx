import { Handshake } from "lucide-react";
import { SupplierDrawer } from "@/components/admin/supplier-drawer";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { listAdminSuppliers } from "@/lib/dashboard";
import type { SupplierDTO } from "@/types";

export default async function SuppliersPage() {
  const suppliers = await listAdminSuppliers() as SupplierDTO[];
  return <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Suppliers</h2><p className="text-sm text-muted-foreground">{suppliers.length} operational suppliers</p></div><SupplierDrawer /></div>{suppliers.length ? <Card><CardContent className="overflow-x-auto p-0"><table className="w-full text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-4">Supplier</th><th className="p-4">Type</th><th className="p-4">Contact</th><th className="p-4">Location</th><th className="p-4">Commission</th><th className="p-4">Status</th><th className="p-4 text-right">Action</th></tr></thead><tbody>{suppliers.map((item) => <tr key={item._id} className="border-b border-border/50"><td className="p-4"><p className="font-medium">{item.companyName}</p><p className="text-xs text-muted-foreground">{item.contactName || "No contact person"}</p></td><td className="p-4">{item.type}</td><td className="p-4"><p>{item.phone}</p><p className="text-xs text-muted-foreground">{item.email || "—"}</p></td><td className="p-4">{[item.city, item.country].filter(Boolean).join(", ")}</td><td className="p-4">{item.commissionRate}%</td><td className="p-4"><StatusBadge status={item.status} /></td><td className="p-4 text-right"><SupplierDrawer supplier={item} /></td></tr>)}</tbody></table></CardContent></Card> : <EmptyState icon={Handshake} title="No suppliers yet" action={<SupplierDrawer />} />}</div>;
}

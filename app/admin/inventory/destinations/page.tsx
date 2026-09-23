import { DestinationDrawer } from "@/components/admin/destination-drawer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { listAdminDestinations } from "@/lib/dashboard";
import { destinationImage } from "@/lib/images";
import { formatINR } from "@/lib/utils";
import type { DestinationDTO } from "@/types";

export default async function DestinationsInventoryPage() {
  const destinations = await listAdminDestinations() as DestinationDTO[];
  return <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Destinations</h2><p className="text-sm text-muted-foreground">Destination content used across discovery and itineraries.</p></div><DestinationDrawer /></div>
    <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-lg border border-border bg-secondary/30 px-4 py-3 text-sm"><Stat label="Destinations" value={destinations.length} /><Stat label="Active" value={destinations.filter((item) => item.status === "active").length} /><Stat label="Featured" value={destinations.filter((item) => item.featured).length} /><Stat label="Popular" value={destinations.filter((item) => item.popular).length} /></div>
    <Card><CardContent className="overflow-x-auto p-0">{destinations.length ? <table className="w-full min-w-[780px] text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-4">Destination</th><th className="p-4">Starting price</th><th className="p-4">Tags</th><th className="p-4">Visibility</th><th className="p-4">Status</th><th className="p-4 text-right">Action</th></tr></thead><tbody>{destinations.map((item) => <tr key={item._id} className="border-b border-border/50 align-top hover:bg-secondary/30"><td className="p-4"><div className="flex w-52 items-center gap-3"><div className="h-10 w-16 shrink-0 rounded-md bg-cover bg-center" style={{ backgroundImage: `url(${JSON.stringify(item.images?.[0] || destinationImage(item.title)).slice(1, -1)})` }} /><div><p className="font-semibold">{item.title}</p><p>{item.country}</p></div></div></td><td className="p-4 font-semibold text-primary">{formatINR(item.basePrice)}</td><td className="max-w-56 p-4"><div className="flex flex-wrap gap-1">{item.tags?.length ? item.tags.slice(0, 3).map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>) : <span className="text-xs text-muted-foreground">No tags</span>}{item.tags?.length > 3 ? <Badge variant="outline">+{item.tags.length - 3}</Badge> : null}</div></td><td className="p-4"><div className="space-y-1">{item.featured ? <Badge variant="warning">Featured</Badge> : null}{item.popular ? <Badge variant="accent">Popular</Badge> : null}{!item.featured && !item.popular ? <span className="text-xs text-muted-foreground">Standard</span> : null}</div></td><td className="p-4"><StatusBadge status={item.status} /></td><td className="p-4 text-right"><DestinationDrawer destination={item} /></td></tr>)}</tbody></table> : <div className="py-12 text-center text-sm text-muted-foreground">No destinations configured.</div>}</CardContent></Card>
  </div>;
}

function Stat({ label, value }: { label: string; value: number }) { return <p><span className="text-muted-foreground">{label}:</span> <span className="font-bold">{value}</span></p>; }

import Link from "next/link";
import { LeadDrawer } from "@/components/admin/lead-drawer";
import { LeadsList } from "@/components/admin/leads-list";
import { listAdminCampaigns, listAdminLeads } from "@/lib/dashboard";
import type { CampaignDTO, LeadDTO } from "@/types";

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ campaign?: string }> }) {
  const campaignId = (await searchParams).campaign;
  const [leads, campaigns] = await Promise.all([listAdminLeads(campaignId) as Promise<LeadDTO[]>, listAdminCampaigns() as Promise<CampaignDTO[]>]);
  const campaign = campaigns.find((item) => item._id === campaignId);
  return <div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Leads</h2><p className="text-sm text-muted-foreground">{campaign ? `${leads.length} leads from ${campaign.name}` : `${leads.length} total customer enquiries`}{campaign ? <> · <Link href="/admin/lms/leads" className="text-primary hover:underline">Clear campaign filter</Link></> : null}</p></div><LeadDrawer campaigns={campaigns} defaultCampaignId={campaignId} /></div>
  <LeadsList leads={leads} campaigns={campaigns} defaultCampaignId={campaignId} /></div>;
}

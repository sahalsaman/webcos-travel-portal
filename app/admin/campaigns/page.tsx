import Link from "next/link";
import { Megaphone, UsersRound } from "lucide-react";
import { CampaignDrawer } from "@/components/admin/campaign-drawer";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { listAdminCampaigns } from "@/lib/dashboard";
import { formatDate, formatINR } from "@/lib/utils";
import type { CampaignDTO } from "@/types";

export default async function AdminCampaignsPage() {
  const campaigns = (await listAdminCampaigns()) as CampaignDTO[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Marketing Campaigns</h1>
          <p className="text-muted-foreground">{campaigns.length} total campaigns</p>
        </div>
        <CampaignDrawer />
      </div>

      {campaigns.length ? (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="p-4 font-medium">Campaign</th>
                  <th className="p-4 font-medium">Channel</th>
                  <th className="p-4 font-medium">Audience</th>
                  <th className="p-4 font-medium">Schedule</th>
                  <th className="p-4 font-medium">Budget / Spent</th>
                  <th className="p-4 font-medium">Leads</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign._id} className="border-b border-border/50 align-top hover:bg-secondary/40">
                    <td className="p-4">
                      <p className="font-medium">{campaign.name}</p>
                      <p className="text-xs text-muted-foreground">{campaign.owner || "No owner assigned"}</p>
                    </td>
                    <td className="p-4">{campaign.channel}</td>
                    <td className="max-w-56 p-4 text-muted-foreground"><p className="line-clamp-2">{campaign.targetAudience}</p></td>
                    <td className="p-4 text-muted-foreground">
                      <p>{formatDate(campaign.startDate)}</p>
                      <p className="text-xs">to {campaign.endDate ? formatDate(campaign.endDate) : "Open ended"}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium">{formatINR(campaign.budget)}</p>
                      <p className="text-xs text-muted-foreground">Spent {formatINR(campaign.spent)}</p>
                    </td>
                    <td className="p-4"><Link href={`/admin/lms/leads?campaign=${campaign._id}`} className="inline-flex items-center gap-1 font-medium text-primary hover:underline"><UsersRound className="size-4" />{campaign.leadCount ?? 0}</Link></td>
                    <td className="p-4"><StatusBadge status={campaign.status} /></td>
                    <td className="p-4 text-right"><CampaignDrawer campaign={campaign} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      ) : (
        <EmptyState icon={Megaphone} title="No campaigns yet" description="Create campaigns to plan channels, audiences, schedules, and budgets." action={<CampaignDrawer />} />
      )}
    </div>
  );
}

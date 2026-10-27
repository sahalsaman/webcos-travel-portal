import { businessModel } from "@/lib/business";
import { platformSupportTicketModel } from "@/lib/platform-console";
import { handleError, ok } from "@/lib/api";
import { requireSuperAdmin } from "@/lib/super-admin";

export async function GET() {
  try {
    await requireSuperAdmin();
    const [Business, Ticket] = await Promise.all([businessModel(), platformSupportTicketModel()]);
    const [totalTenants, activeTenants, suspendedTenants, openTickets, recentTenants, recentTickets] = await Promise.all([
      Business.countDocuments({ provisioned: true }), Business.countDocuments({ provisioned: true, status: "active" }),
      Business.countDocuments({ provisioned: true, status: "suspended" }), Ticket.countDocuments({ status: { $in: ["open", "in_progress"] } }),
      Business.find({ provisioned: true }).select("name slug status subscription createdAt").sort({ createdAt: -1 }).limit(5).lean(),
      Ticket.find().populate("business", "name slug").sort({ createdAt: -1 }).limit(5).lean(),
    ]);
    return ok({ totalTenants, activeTenants, suspendedTenants, openTickets, recentTenants, recentTickets });
  } catch (error) { return handleError(error); }
}

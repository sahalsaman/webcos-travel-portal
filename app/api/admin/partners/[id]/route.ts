import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { ok, fail, handleError, requireApiRole } from "@/lib/api";
import { PARTNER_STATUSES } from "@/lib/constants";
import "@/models";
import Partner from "@/models/Partner";
import PartnerTrip from "@/models/PartnerTrip";
import Notification from "@/models/Notification";

type Ctx = { params: Promise<{ id: string }> };

/** Admin: approve / suspend / reset a partner. */
export async function PATCH(request: Request, { params }: Ctx) {
  try {
    await requireApiRole(["admin"]);
    const { id } = await params;
    const { status } = await request.json();
    if (!PARTNER_STATUSES.includes(status)) return fail("Invalid status", 400);

    await connectDB();
    const partner = await (await tenantModel(Partner)).findByIdAndUpdate(id, { status }, { new: true });
    if (!partner) return fail("Partner not found", 404);

    // Keep white-label links in sync with approval state.
    await (await tenantModel(PartnerTrip)).updateMany(
      { partner: partner._id },
      { $set: { active: status === "approved" } },
    );

    await (await tenantModel(Notification)).create({
      user: partner.user,
      type: "system",
      title:
        status === "approved"
          ? "Partner account approved ✅"
          : `Partner account ${status}`,
      message:
        status === "approved"
          ? "Your partner account is live. Start creating white-label links!"
          : `Your partner account status is now "${status}".`,
    });

    return ok({ id: String(partner._id), status });
  } catch (err) {
    return handleError(err);
  }
}

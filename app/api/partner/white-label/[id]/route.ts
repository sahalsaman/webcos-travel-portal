import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { ok, fail, handleError, requireApiRole } from "@/lib/api";
import { sellingPrice } from "@/lib/commission";
import "@/models";
import Partner from "@/models/Partner";
import PartnerTrip from "@/models/PartnerTrip";
import Trip from "@/models/Trip";

type Ctx = { params: Promise<{ id: string }> };

async function ownedListing(userId: string, id: string) {
  const partner = await (await tenantModel(Partner)).findOne({ user: userId }).select("_id status");
  if (!partner) return null;
  const pt = await (await tenantModel(PartnerTrip)).findOne({ _id: id, partner: partner._id });
  return pt ? { partner, pt } : null;
}

/** Partner: update commission or toggle active state. */
export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const user = await requireApiRole(["partner"]);
    const { id } = await params;
    const body = await request.json();
    await connectDB();

    const owned = await ownedListing(user.id, id);
    if (!owned) return fail("Listing not found", 404);
    const { pt } = owned;

    if (typeof body.commission === "number") {
      const trip = await (await tenantModel(Trip)).findById(pt.trip).select("basePrice");
      pt.commission = Math.max(0, body.commission);
      pt.sellingPrice = sellingPrice(trip?.basePrice ?? 0, pt.commission);
    }
    if (typeof body.active === "boolean") {
      pt.active = body.active && owned.partner.status === "approved";
    }
    await pt.save();
    return ok({ id: String(pt._id), commission: pt.commission, sellingPrice: pt.sellingPrice, active: pt.active });
  } catch (err) {
    return handleError(err);
  }
}

/** Partner: remove a white-label listing. */
export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const user = await requireApiRole(["partner"]);
    const { id } = await params;
    await connectDB();
    const owned = await ownedListing(user.id, id);
    if (!owned) return fail("Listing not found", 404);
    await owned.pt.deleteOne();
    return ok({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}

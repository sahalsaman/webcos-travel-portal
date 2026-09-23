import { getBusiness } from "@/lib/business";
import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { ok, fail, handleError, requireApiRole } from "@/lib/api";
import { whiteLabelSchema } from "@/lib/validations";
import { sellingPrice } from "@/lib/commission";
import { whiteLabelUrl } from "@/lib/utils";
import "@/models";
import Partner from "@/models/Partner";
import Trip from "@/models/Trip";
import PartnerTrip from "@/models/PartnerTrip";

/** Partner: create or update a white-label listing for a package. */
export async function POST(request: Request) {
  try {
    const user = await requireApiRole(["partner"]);
    const { tripId, commission } = whiteLabelSchema.parse(await request.json());
    await connectDB();

    const partner = await (await tenantModel(Partner)).findOne({ user: user.id });
    if (!partner) return fail("Partner profile not found", 404);

    const trip = await (await tenantModel(Trip)).findById(tripId);
    if (!trip || trip.status !== "active") {
      return fail("Package is not available for reselling", 404);
    }

    const price = sellingPrice(trip.basePrice, commission);
    const pt = await (await tenantModel(PartnerTrip)).findOneAndUpdate(
      { partner: partner._id, trip: trip._id },
      {
        $set: {
          commission,
          sellingPrice: price,
          partnerSlug: partner.slug,
          tripSlug: trip.slug,
          active: partner.status === "approved",
        },
        $setOnInsert: { partner: partner._id, trip: trip._id },
      },
      { upsert: true, new: true },
    );

    return ok({
      id: String(pt._id),
      url: whiteLabelUrl(partner.slug, trip.slug, (await getBusiness()).siteUrl),
      sellingPrice: price,
      active: pt.active,
    });
  } catch (err) {
    return handleError(err);
  }
}

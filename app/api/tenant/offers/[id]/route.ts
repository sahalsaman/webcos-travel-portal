import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { ok, fail, handleError, requireApiRole } from "@/lib/api";
import { offerCardSchema } from "@/lib/validations";
import "@/models";
import OfferCard from "@/models/OfferCard";
import { collectCloudinaryUrls, removeUnusedCloudinaryImages } from "@/lib/cloudinary-media";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    await requireApiRole(["tenant", "tenant_employee"]);
    const { id } = await params;
    const data = offerCardSchema.partial().parse(await request.json());
    await connectDB();

    const update = {
      ...data,
      ...(data.countryCode ? { countryCode: data.countryCode.toUpperCase() } : {}),
    };
    const OfferModel = await tenantModel(OfferCard);
    const previous = await OfferModel.findById(id).lean();
    const offer = await OfferModel.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!offer) return fail("Offer card not found", 404);
    if (previous) await removeUnusedCloudinaryImages(collectCloudinaryUrls(previous));
    return ok(offer);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    await requireApiRole(["tenant", "tenant_employee"]);
    const { id } = await params;
    await connectDB();
    const res = await (await tenantModel(OfferCard)).findByIdAndDelete(id);
    if (!res) return fail("Offer card not found", 404);
    await removeUnusedCloudinaryImages(collectCloudinaryUrls(res));
    return ok({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}

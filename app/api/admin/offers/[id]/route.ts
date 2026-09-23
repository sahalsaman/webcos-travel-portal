import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { ok, fail, handleError, requireApiRole } from "@/lib/api";
import { offerCardSchema } from "@/lib/validations";
import "@/models";
import OfferCard from "@/models/OfferCard";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    await requireApiRole(["admin"]);
    const { id } = await params;
    const data = offerCardSchema.partial().parse(await request.json());
    await connectDB();

    const update = {
      ...data,
      ...(data.countryCode ? { countryCode: data.countryCode.toUpperCase() } : {}),
    };
    const offer = await (await tenantModel(OfferCard)).findByIdAndUpdate(id, update, { new: true }).lean();
    if (!offer) return fail("Offer card not found", 404);
    return ok(offer);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    await requireApiRole(["admin"]);
    const { id } = await params;
    await connectDB();
    const res = await (await tenantModel(OfferCard)).findByIdAndDelete(id);
    if (!res) return fail("Offer card not found", 404);
    return ok({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}

import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { ok, handleError, requireApiRole } from "@/lib/api";
import { offerCardSchema } from "@/lib/validations";
import "@/models";
import OfferCard from "@/models/OfferCard";

export async function GET() {
  try {
    await requireApiRole(["admin"]);
    await connectDB();
    const offers = await (await tenantModel(OfferCard)).find({}).sort({ sortOrder: 1, createdAt: -1 }).lean();
    return ok(offers);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireApiRole(["admin"]);
    const data = offerCardSchema.parse(await request.json());
    await connectDB();
    const offer = await (await tenantModel(OfferCard)).create({
      ...data,
      countryCode: data.countryCode.toUpperCase(),
    });
    return ok({ id: String(offer._id) }, 201);
  } catch (err) {
    return handleError(err);
  }
}

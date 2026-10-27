import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { ok, fail, handleError, requireApiRole } from "@/lib/api";
import { destinationSchema } from "@/lib/validations";
import "@/models";
import Destination from "@/models/Destination";
import { collectCloudinaryUrls, removeUnusedCloudinaryImages } from "@/lib/cloudinary-media";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    await requireApiRole(["tenant", "tenant_employee"]);
    const { id } = await params;
    const data = destinationSchema.partial().parse(await request.json());
    await connectDB();
    const update = data.countryCode ? { ...data, countryCode: data.countryCode.toUpperCase() } : data;
    const DestinationModel = await tenantModel(Destination);
    const previous = await DestinationModel.findById(id).lean();
    const destination = await DestinationModel.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!destination) return fail("Destination not found", 404);
    if (previous) await removeUnusedCloudinaryImages(collectCloudinaryUrls(previous));
    return ok(destination);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    await requireApiRole(["tenant", "tenant_employee"]);
    const { id } = await params;
    await connectDB();
    const destination = await (await tenantModel(Destination)).findByIdAndDelete(id);
    if (!destination) return fail("Destination not found", 404);
    await removeUnusedCloudinaryImages(collectCloudinaryUrls(destination));
    return ok({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}

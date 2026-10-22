import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { fail, handleError, ok, requireApiRole } from "@/lib/api";
import { activitySchema } from "@/lib/validations";
import Activity from "@/models/Activity";
import { collectCloudinaryUrls, removeUnusedCloudinaryImages } from "@/lib/cloudinary-media";

type Ctx = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Ctx) {
  try {
    await requireApiRole(["admin"]);
    const { id } = await params;
    const data = activitySchema.partial().parse(await request.json());
    await connectDB();
    const ActivityModel = await tenantModel(Activity);
    const previous = await ActivityModel.findById(id).lean();
    const item = await ActivityModel.findByIdAndUpdate(id, data, { new: true }).lean();
    if (previous && item) await removeUnusedCloudinaryImages(collectCloudinaryUrls(previous));
    return item ? ok(item) : fail("Activity not found", 404);
  } catch (error) { return handleError(error); }
}

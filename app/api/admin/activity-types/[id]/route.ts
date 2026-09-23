import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { fail, handleError, ok, requireApiRole } from "@/lib/api";
import { activityTypeSchema } from "@/lib/validations";
import ActivityType from "@/models/ActivityType";

type Ctx = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Ctx) {
  try {
    await requireApiRole(["admin"]);
    const { id } = await params;
    const data = activityTypeSchema.partial().parse(await request.json());
    await connectDB();
    const item = await (await tenantModel(ActivityType)).findByIdAndUpdate(id, data, { new: true }).lean();
    return item ? ok(item) : fail("Activity type not found", 404);
  } catch (error) { return handleError(error); }
}

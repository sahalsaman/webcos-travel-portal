import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { fail, handleError, ok, requireApiRole } from "@/lib/api";
import { activitySchema } from "@/lib/validations";
import Activity from "@/models/Activity";

type Ctx = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Ctx) {
  try {
    await requireApiRole(["admin"]);
    const { id } = await params;
    const data = activitySchema.partial().parse(await request.json());
    await connectDB();
    const item = await (await tenantModel(Activity)).findByIdAndUpdate(id, data, { new: true }).lean();
    return item ? ok(item) : fail("Activity not found", 404);
  } catch (error) { return handleError(error); }
}

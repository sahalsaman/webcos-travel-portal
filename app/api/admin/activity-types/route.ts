import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { handleError, ok, requireApiRole } from "@/lib/api";
import { activityTypeSchema } from "@/lib/validations";
import ActivityType from "@/models/ActivityType";

export async function POST(request: Request) {
  try {
    await requireApiRole(["admin"]);
    const data = activityTypeSchema.parse(await request.json());
    await connectDB();
    const item = await (await tenantModel(ActivityType)).create(data);
    return ok({ id: String(item._id) }, 201);
  } catch (error) { return handleError(error); }
}

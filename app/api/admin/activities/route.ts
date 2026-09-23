import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { handleError, ok, requireApiRole } from "@/lib/api";
import { activitySchema } from "@/lib/validations";
import Activity from "@/models/Activity";

export async function POST(request: Request) {
  try {
    await requireApiRole(["admin"]);
    const data = activitySchema.parse(await request.json());
    await connectDB();
    const item = await (await tenantModel(Activity)).create(data);
    return ok({ id: String(item._id) }, 201);
  } catch (error) { return handleError(error); }
}

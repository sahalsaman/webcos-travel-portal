import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { handleError, ok, requireApiRole } from "@/lib/api";
import { campaignSchema } from "@/lib/validations";
import "@/models";
import Campaign from "@/models/Campaign";

export async function GET() {
  try {
    await requireApiRole(["admin"]);
    await connectDB();
    const campaigns = await (await tenantModel(Campaign)).find({}).sort({ startDate: -1, createdAt: -1 }).lean();
    return ok(campaigns);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireApiRole(["admin"]);
    const data = campaignSchema.parse(await request.json());
    await connectDB();
    const campaign = await (await tenantModel(Campaign)).create({ ...data, endDate: data.endDate || null });
    return ok({ id: String(campaign._id) }, 201);
  } catch (err) {
    return handleError(err);
  }
}

import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { fail, handleError, ok, requireApiRole } from "@/lib/api";
import { campaignSchema } from "@/lib/validations";
import "@/models";
import Campaign from "@/models/Campaign";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    await requireApiRole(["admin"]);
    const { id } = await params;
    const data = campaignSchema.partial().parse(await request.json());
    await connectDB();
    const campaign = await (await tenantModel(Campaign)).findByIdAndUpdate(
      id,
      { ...data, ...(data.endDate !== undefined ? { endDate: data.endDate || null } : {}) },
      { new: true, runValidators: true },
    ).lean();
    if (!campaign) return fail("Campaign not found", 404);
    return ok(campaign);
  } catch (err) {
    return handleError(err);
  }
}

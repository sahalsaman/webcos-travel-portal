import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { ok, fail, handleError, requireApiRole } from "@/lib/api";
import "@/models";
import Partner from "@/models/Partner";

/** Partner: update business profile / branding. */
export async function PATCH(request: Request) {
  try {
    const user = await requireApiRole(["partner"]);
    const body = await request.json();
    await connectDB();

    const allowed = [
      "businessName",
      "partnerType",
      "bio",
      "contactEmail",
      "contactPhone",
      "logo",
      "bannerImage",
      "profileImage",
      "socialLinks",
    ] as const;
    const update: Record<string, unknown> = {};
    for (const k of allowed) if (body[k] !== undefined) update[k] = body[k];

    const partner = await (await tenantModel(Partner)).findOneAndUpdate({ user: user.id }, update, {
      new: true,
    }).lean();
    if (!partner) return fail("Partner profile not found", 404);
    return ok({ updated: true });
  } catch (err) {
    return handleError(err);
  }
}

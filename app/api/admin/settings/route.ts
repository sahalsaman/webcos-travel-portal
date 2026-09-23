import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { ok, handleError, requireApiRole } from "@/lib/api";
import "@/models";
import Settings, { getSettings } from "@/models/Settings";

export async function GET() {
  try {
    await requireApiRole(["admin"]);
    await connectDB();
    return ok(await getSettings());
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireApiRole(["admin"]);
    const body = await request.json();
    await connectDB();

    const allowed = [
      "defaultCommission",
      "platformFeePercent",
      "platformFeeFlat",
      "currency",
      "minWithdrawal",
      "quotationTerms",
      "quotationPolicy",
      "quotationImportantInformation",
      "quotationOtherInformation",
    ] as const;
    const update: Record<string, unknown> = {};
    for (const k of allowed) {
      if (body[k] !== undefined) update[k] = body[k];
    }

    const settings = await (await tenantModel(Settings)).findOneAndUpdate({ key: "global" }, update, {
      new: true,
      upsert: true,
    }).lean();
    return ok(settings);
  } catch (err) {
    return handleError(err);
  }
}

import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { fail, handleError, ok, requireApiRole } from "@/lib/api";
import { leadSchema } from "@/lib/validations";
import "@/models";
import Lead from "@/models/Lead";
import Quotation from "@/models/Quotation";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    await requireApiRole(["admin"]);
    const { id } = await params;
    const data = leadSchema.parse(await request.json());
    await connectDB();
    const lead = await (await tenantModel(Lead)).findByIdAndUpdate(id, {
      ...data,
      email: data.email?.toLowerCase() || "",
      campaign: data.source === "Marketing Campaign" && data.campaignId ? data.campaignId : null,
      travelDate: data.travelDate ? new Date(data.travelDate) : null,
    }, { new: true, runValidators: true }).lean();
    if (!lead) return fail("Lead not found", 404);
    return ok(lead);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    await requireApiRole(["admin"]);
    const { id } = await params;
    await connectDB();
    const lead = await (await tenantModel(Lead)).findByIdAndDelete(id);
    if (!lead) return fail("Lead not found", 404);
    await (await tenantModel(Quotation)).updateMany({ lead: id }, { $set: { lead: null } });
    return ok({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}

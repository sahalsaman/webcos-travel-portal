import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { fail, handleError, ok, requireApiRole } from "@/lib/api";
import { visaSchema } from "@/lib/validations";
import VisaApplication from "@/models/VisaApplication";
import { resolveCustomerReference } from "@/lib/customer-reference";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    await requireApiRole(["admin"]);
    const { id } = await params;
    const data = visaSchema.parse(await request.json());
    await connectDB();
    const linked = await resolveCustomerReference(data.leadId, data.customerId);
    const visa = await (await tenantModel(VisaApplication)).findByIdAndUpdate(id, {
      ...data,
      ...linked,
      applicantName: linked.customerName,
      phone: linked.phone,
      email: linked.email,
      submittedAt: data.submittedAt ? new Date(data.submittedAt) : null,
      expectedAt: data.expectedAt ? new Date(data.expectedAt) : null,
      completedAt: data.completedAt ? new Date(data.completedAt) : null,
    }, { new: true, runValidators: true }).lean();
    if (!visa) return fail("Visa application not found", 404);
    return ok(visa);
  } catch (error) {
    return handleError(error);
  }

}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    await requireApiRole(["admin"]);
    const { id } = await params;
    await connectDB();
    const visa = await (await tenantModel(VisaApplication)).findByIdAndDelete(id);
    if (!visa) return fail("Visa application not found", 404);
    return ok({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}

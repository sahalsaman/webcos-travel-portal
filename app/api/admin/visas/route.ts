import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { handleError, ok, requireApiRole } from "@/lib/api";
import { visaSchema } from "@/lib/validations";
import { shortId } from "@/lib/utils";
import VisaApplication from "@/models/VisaApplication";
import { resolveCustomerReference } from "@/lib/customer-reference";

export async function GET() {
  try {
    await requireApiRole(["admin"]);
    await connectDB();
    return ok(await (await tenantModel(VisaApplication)).find({}).sort({ createdAt: -1 }).lean());
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireApiRole(["admin"]);
    const data = visaSchema.parse(await request.json());
    await connectDB();
    const linked = await resolveCustomerReference(data.leadId, data.customerId);
    const visa = await (await tenantModel(VisaApplication)).create({
      ...data,
      ...linked,
      applicantName: linked.customerName,
      phone: linked.phone,
      email: linked.email,
      visaNumber: shortId("VISA-"),
      submittedAt: data.submittedAt ? new Date(data.submittedAt) : null,
      expectedAt: data.expectedAt ? new Date(data.expectedAt) : null,
      completedAt: data.completedAt ? new Date(data.completedAt) : null,
    });
    return ok({ id: String(visa._id), visaNumber: visa.visaNumber }, 201);
  } catch (error) {
    return handleError(error);
  }
}

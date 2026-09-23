import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { fail, handleError, ok, requireApiRole } from "@/lib/api";
import { calculateQuotation } from "@/lib/quotation";
import { quotationSchema } from "@/lib/validations";
import "@/models";
import Quotation from "@/models/Quotation";
import Lead from "@/models/Lead";
import { resolveCustomerReference } from "@/lib/customer-reference";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    await requireApiRole(["admin"]);
    const { id } = await params;
    const data = quotationSchema.parse(await request.json());
    const totals = calculateQuotation(data.items, data.discount, data.taxRate);
    await connectDB();
    const linked = await resolveCustomerReference(data.leadId, data.customerId);
    const current = await (await tenantModel(Quotation)).findById(id).select("lead");
    if (!current) return fail("Quotation not found", 404);
    const quotation = await (await tenantModel(Quotation)).findByIdAndUpdate(
      id,
      {
        ...data,
        customerName: linked.customerName,
        customerPhone: linked.phone,
        customerEmail: linked.email,
        ...totals,
        lead: data.leadId || null,
        customer: data.customerId || null,
        trip: data.itineraryId || null,
        validUntil: new Date(data.validUntil),
      },
      { new: true, runValidators: true },
    ).lean();
    if (!quotation) return fail("Quotation not found", 404);
    if (current.lead && String(current.lead) !== data.leadId) {
      await (await tenantModel(Lead)).updateOne({ _id: current.lead, quotation: id }, { $set: { quotation: null } });
    }
    if (data.leadId) {
      await (await tenantModel(Lead)).findByIdAndUpdate(data.leadId, { quotation: id, status: data.status === "accepted" ? "won" : data.status === "rejected" ? "lost" : "quoted" });
    }
    return ok(quotation);
  } catch (err) {
    return handleError(err);
  }
}

import { tenantModel } from "@/lib/tenant-db";
import { randomUUID } from "crypto";
import { connectDB } from "@/lib/db";
import { handleError, ok, requireApiRole } from "@/lib/api";
import { calculateQuotation } from "@/lib/quotation";
import { quotationSchema } from "@/lib/validations";
import { shortId } from "@/lib/utils";
import "@/models";
import Quotation from "@/models/Quotation";
import Lead from "@/models/Lead";
import { getSettings } from "@/models/Settings";
import { resolveCustomerReference } from "@/lib/customer-reference";

export async function GET() {
  try {
    await requireApiRole(["admin"]);
    await connectDB();
    const quotations = await (await tenantModel(Quotation)).find({}).sort({ createdAt: -1 }).populate("lead", "leadNumber customerName").populate("customer", "name email mobile").populate("trip", "title destination basePrice").lean();
    return ok(quotations);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireApiRole(["admin"]);
    const data = quotationSchema.parse(await request.json());
    const totals = calculateQuotation(data.items, data.discount, data.taxRate);
    await connectDB();
    const settings = await getSettings();
    const linked = await resolveCustomerReference(data.leadId, data.customerId);
    const quotation = await (await tenantModel(Quotation)).create({
      ...data,
      customerName: linked.customerName,
      customerPhone: linked.phone,
      customerEmail: linked.email,
      terms: data.terms || settings.quotationTerms || "",
      policy: data.policy || settings.quotationPolicy || "",
      importantInformation: data.importantInformation || settings.quotationImportantInformation || "",
      otherInformation: data.otherInformation || settings.quotationOtherInformation || "",
      ...totals,
      lead: data.leadId || null,
      customer: data.customerId || null,
      trip: data.itineraryId || null,
      quotationNumber: shortId("QTN-"),
      shareToken: randomUUID().replaceAll("-", ""),
      validUntil: new Date(data.validUntil),
    });
    if (data.leadId) {
      await (await tenantModel(Lead)).findByIdAndUpdate(data.leadId, { quotation: quotation._id, status: data.status === "accepted" ? "won" : data.status === "rejected" ? "lost" : "quoted" });
    }
    return ok({ id: String(quotation._id) }, 201);
  } catch (err) {
    return handleError(err);
  }
}

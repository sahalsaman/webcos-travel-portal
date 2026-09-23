import { tenantModel } from "@/lib/tenant-db";
import Lead from "@/models/Lead";
import User from "@/models/User";

export async function resolveCustomerReference(leadId?: string, customerId?: string) {
  if (leadId) {
    const lead = await (await tenantModel(Lead)).findById(leadId).select("customerName phone email").lean();
    if (!lead) throw new Error("Selected lead was not found");
    return { lead: leadId, customer: null, customerName: lead.customerName, phone: lead.phone, email: lead.email || "" };
  }
  if (customerId) {
    const customer = await (await tenantModel(User)).findOne({ _id: customerId, role: "traveler" }).select("name mobile email").lean();
    if (!customer) throw new Error("Selected customer was not found");
    return { lead: null, customer: customerId, customerName: customer.name, phone: customer.mobile || "", email: customer.email || "" };
  }
  throw new Error("Select a customer or lead");
}

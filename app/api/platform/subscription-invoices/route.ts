import { z } from "zod";
import { businessModel } from "@/lib/business";
import { platformSubscriptionInvoiceModel } from "@/lib/platform-console";
import { generateDueSubscriptionInvoices } from "@/lib/platform-subscription-invoices";
import { fail, handleError, ok } from "@/lib/api";
import { requireSuperAdmin } from "@/lib/super-admin";
export async function GET() { try { await requireSuperAdmin(); const [Business, Invoice] = await Promise.all([businessModel(), platformSubscriptionInvoiceModel()]); await generateDueSubscriptionInvoices(Business, Invoice); return ok(await Invoice.find().populate("business", "name slug").sort({ month: -1, generatedAt: -1 }).lean()); } catch (error) { return handleError(error); } }
export async function PATCH(request: Request) { try { await requireSuperAdmin(); const input = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i), status: z.enum(["pending", "paid", "overdue", "cancelled"]) }).parse(await request.json()); const Invoice = await platformSubscriptionInvoiceModel(); const invoice = await Invoice.findByIdAndUpdate(input.id, { status: input.status, paidAt: input.status === "paid" ? new Date() : null }, { new: true }).populate("business", "name slug").lean(); return invoice ? ok(invoice) : fail("Subscription invoice not found", 404); } catch (error) { return handleError(error); } }

import type { Model } from "mongoose";

const billingMonth = (date = new Date()) => date.toISOString().slice(0, 7);

function dueThisMonth(startedAt: Date, now: Date) {
  const dueDay = Math.min(
    startedAt.getUTCDate(),
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate(),
  );
  return now.getUTCDate() >= dueDay;
}

/**
 * Creates at most one invoice per tenant and month. It is safe to call from
 * the invoice list and immediately after a subscription is started.
 */
export async function generateDueSubscriptionInvoices(Business: Model<any>, Invoice: Model<any>, now = new Date()) {
  const month = billingMonth(now);
  const businesses = await Business.find({ provisioned: true, status: "active" })
    .select("subscription")
    .lean();

  for (const business of businesses) {
    const subscription = business.subscription;
    const startedAt = subscription?.startedAt ? new Date(subscription.startedAt) : null;
    if (!subscription || subscription.status === "cancelled" || !startedAt || startedAt > now || !dueThisMonth(startedAt, now)) continue;
    if (await Invoice.exists({ business: business._id, month })) continue;

    const older = await Invoice.find({ business: business._id, status: { $in: ["pending", "overdue"] }, month: { $lt: month } }).lean();
    const carryForward = older.reduce((total: number, invoice: { totalAmount?: number }) => total + Number(invoice.totalAmount || 0), 0);
    if (older.length) await Invoice.updateMany({ _id: { $in: older.map((invoice: { _id: unknown }) => invoice._id) } }, { $set: { status: "overdue" } });

    const firstInvoice = !await Invoice.exists({ business: business._id });
    const setupFee = firstInvoice ? Math.max(0, Number(subscription.setupFee || 0) - Number(subscription.setupPaidAmount || 0)) : 0;
    const monthlyAmount = Number(subscription.amount || 0);
    await Invoice.create({ business: business._id, month, plan: subscription.plan, monthlyAmount, setupFee, carryForward, totalAmount: monthlyAmount + setupFee + carryForward });
  }
}

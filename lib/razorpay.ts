import crypto from "node:crypto";
import Razorpay from "razorpay";
import { getBusiness } from "@/lib/business";

/** Credentials are configured per agency in the server's secret store, never in the website. */
export async function paymentConfig() {
  const business = await getBusiness();
  const all = JSON.parse(process.env.BUSINESS_PAYMENT_CREDENTIALS || "{}") as Record<string, { keyId?: string; keySecret?: string }>;
  const credentials = all[business.slug] || (business.slug === "voibee"
    ? { keyId: process.env.RAZORPAY_KEY_ID, keySecret: process.env.RAZORPAY_KEY_SECRET }
    : {});
  return { ...credentials, configured: Boolean(credentials.keyId && credentials.keySecret) };
}
export async function getRazorpay() {
  const c = await paymentConfig();
  return c.configured ? new Razorpay({ key_id: c.keyId!, key_secret: c.keySecret! }) : null;
}
export async function createOrder(amountRupees: number, receipt: string) {
  const client = await getRazorpay();
  if (!client) throw new Error("Online payment is not configured for this business");
  return client.orders.create({ amount: Math.round(amountRupees * 100), currency: "INR", receipt });
}
export async function refundPayment(paymentId: string, amountRupees?: number) {
  const client = await getRazorpay();
  if (!client) throw new Error("Payment gateway is not configured");
  return client.payments.refund(paymentId, amountRupees === undefined ? {} : { amount: Math.round(amountRupees * 100) });
}
export async function verifySignature(orderId: string, paymentId: string, signature: string) {
  const { keySecret } = await paymentConfig();
  if (!keySecret) return false;
  const expected = crypto.createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  try { return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature)); } catch { return false; }
}

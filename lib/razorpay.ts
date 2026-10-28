import crypto from "node:crypto";
import Razorpay from "razorpay";
import { getBusiness, getBusinessCredentials } from "@/lib/business";

/** Credentials are configured per agency in the server's secret store, never in the website. */
export async function paymentConfig() {
  const business = await getBusiness();
  const integration = (await getBusinessCredentials(business)).find(
    (credential) => credential.platform === "RAZORPAY_API",
  );
  const all = JSON.parse(process.env.BUSINESS_PAYMENT_CREDENTIALS || "{}") as Record<string, { keyId?: string; keySecret?: string }>;
  // Agency integrations are the canonical configuration. The environment map
  // remains a backwards-compatible fallback for older deployments.
  const credentials = {
    keyId: integration?.apikey?.trim() || all[business.slug]?.keyId,
    keySecret: integration?.secretKey?.trim() || all[business.slug]?.keySecret,
  };
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

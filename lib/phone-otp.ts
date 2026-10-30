import crypto from "node:crypto";
import { getBusiness } from "@/lib/business";
import { tenantModel } from "@/lib/tenant-db";
import User from "@/models/User";

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export function normalisePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!/^[1-9]\d{6,14}$/.test(digits)) throw new Error("Enter a valid phone number with country code");
  return `+${digits}`;
}

function hashCode(phone: string, code: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET must be configured before using phone sign-in");
  return crypto.createHmac("sha256", secret).update(`${phone}:${code}`).digest("hex");
}

async function sendWhatsAppOtp(phone: string, code: string) {
  const business = await getBusiness();
  const credential = (business.credentials ?? []).find((item) => item.platform === "WABIS_API");
  const phoneNumberId = credential?.name?.trim(); const accessToken = credential?.apikey?.trim(); const templateName = credential?.secretKey?.trim(); const language = credential?.url?.trim() || "en_US";
  if (!phoneNumberId || !accessToken || !templateName) return { testMode: true };
  const response = await fetch(`https://graph.facebook.com/v22.0/${encodeURIComponent(phoneNumberId)}/messages`, { method: "POST", headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ messaging_product: "whatsapp", to: phone.slice(1), type: "template", template: { name: templateName, language: { code: language }, components: [{ type: "body", parameters: [{ type: "text", text: code }] }] } }) });
  if (!response.ok) throw new Error("We could not send your WhatsApp code. Please try again shortly.");
  return { testMode: false };
}

export async function requestPhoneOtp(input: string, purpose: "login" | "register" = "login") {
  const phone = normalisePhone(input); const business = await getBusiness(); const Users = await tenantModel(User);
  const legacyIndianPhone = phone.startsWith("+91") ? phone.slice(3) : "";
  let user = await Users.findOne({ phone: { $in: [phone, legacyIndianPhone].filter(Boolean) }, role: "tenant_traveler" });
  if (!user && purpose === "login") throw new Error("No account exists with this phone number. Please create an account first.");
  if (!user) user = await Users.create({ name: "Pending traveler", email: `${phone.slice(1)}@phone.voibee.local`, phone, role: "tenant_traveler", businessId: business._id });
  const configured = (business.credentials ?? []).some((item) => item.platform === "WABIS_API" && item.name?.trim() && item.apikey?.trim() && item.secretKey?.trim());
  const deliveredCode = configured ? crypto.randomInt(100000, 1_000_000).toString() : "654321";
  const delivery = await sendWhatsAppOtp(phone, deliveredCode);
  user.otp = { codeHash: hashCode(phone, deliveredCode), attempts: 0, consumedAt: null, expiresAt: new Date(Date.now() + OTP_TTL_MS) };
  await user.save();
  return { phone, testMode: delivery.testMode };
}

export async function verifyPhoneOtp(input: string, code: string, consume = true) {
  const phone = normalisePhone(input); if (!/^\d{6}$/.test(code)) return false;
  const Users = await tenantModel(User); const legacyIndianPhone = phone.startsWith("+91") ? phone.slice(3) : "";
  const user = await Users.findOne({ phone: { $in: [phone, legacyIndianPhone].filter(Boolean) }, role: "tenant_traveler" });
  const otp = user?.otp;
  if (!user || !otp?.codeHash || otp.consumedAt || !otp.expiresAt || otp.expiresAt <= new Date() || otp.attempts >= MAX_ATTEMPTS) return false;
  const expected = Buffer.from(otp.codeHash, "hex"); const actual = Buffer.from(hashCode(phone, code), "hex");
  const valid = expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  if (!valid) { await Users.updateOne({ _id: user._id }, { $inc: { "otp.attempts": 1 } }); return false; }
  if (consume) await Users.updateOne({ _id: user._id }, { $set: { "otp.consumedAt": new Date() } });
  return true;
}

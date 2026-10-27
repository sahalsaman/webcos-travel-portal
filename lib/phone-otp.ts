import crypto from "node:crypto";
import { tenantModel } from "@/lib/tenant-db";
import { getBusiness } from "@/lib/business";
import PhoneOtp from "@/models/PhoneOtp";
import User from "@/models/User";

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const MAX_SENDS_PER_WINDOW = 3;
const SEND_WINDOW_MS = 10 * 60 * 1000;

export function normaliseMobile(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!/^[1-9]\d{6,14}$/.test(digits)) throw new Error("Enter a valid mobile number with country code");
  return `+${digits}`;
}

function hashCode(mobile: string, code: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET must be configured before using phone sign-in");
  return crypto.createHmac("sha256", secret).update(`${mobile}:${code}`).digest("hex");
}

async function sendWhatsAppOtp(mobile: string, code: string) {
  const business = await getBusiness();
  const credential = (business.credentials ?? []).find((item) => item.platform === "WHATSAPP_BUSINESS");
  const phoneNumberId = credential?.name?.trim();
  const accessToken = credential?.apikey?.trim();
  const templateName = credential?.secretKey?.trim();
  const language = credential?.url?.trim() || "en_US";

  if (!phoneNumberId || !accessToken || !templateName) {
    // Explicit temporary fallback requested while WhatsApp Business is being configured.
    return { testMode: true };
  }

  const response = await fetch(`https://graph.facebook.com/v22.0/${encodeURIComponent(phoneNumberId)}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: mobile.slice(1),
      type: "template",
      template: {
        name: templateName,
        language: { code: language },
        components: [{ type: "body", parameters: [{ type: "text", text: code }] }],
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("[auth] WhatsApp OTP delivery failed:", body);
    throw new Error("We could not send your WhatsApp code. Please try again shortly.");
  }
  return { testMode: false };
}

export async function requestPhoneOtp(input: string, purpose: "login" | "register" = "login") {
  const mobile = normaliseMobile(input);
  const business = await getBusiness();
  if (purpose === "login") {
    const legacyIndianMobile = mobile.startsWith("+91") ? mobile.slice(3) : "";
    const user = await (await tenantModel(User)).exists({
      mobile: { $in: [mobile, legacyIndianMobile].filter(Boolean) },
      role: "tenant_traveler",
    });
    if (!user) throw new Error("No account exists with this mobile number. Please create an account first.");
  }
  const Otp = await tenantModel(PhoneOtp);
  const since = new Date(Date.now() - SEND_WINDOW_MS);
  const sentRecently = await Otp.countDocuments({ businessId: business._id, mobile, createdAt: { $gte: since } });
  if (sentRecently >= MAX_SENDS_PER_WINDOW) throw new Error("Too many codes requested. Please wait a few minutes before trying again.");

  const generatedCode = crypto.randomInt(100000, 1_000_000).toString();
  const delivery = await sendWhatsAppOtp(mobile, generatedCode);
  const code = delivery.testMode ? "654321" : generatedCode;
  await Otp.updateMany({ businessId: business._id, mobile, consumedAt: null }, { $set: { consumedAt: new Date() } });
  await Otp.create({ businessId: business._id, mobile, codeHash: hashCode(mobile, code), expiresAt: new Date(Date.now() + OTP_TTL_MS) });
  return { mobile, testMode: delivery.testMode };
}

export async function verifyPhoneOtp(input: string, code: string, consume = true) {
  const mobile = normaliseMobile(input);
  if (!/^\d{6}$/.test(code)) return false;
  const business = await getBusiness();
  const Otp = await tenantModel(PhoneOtp);
  const otp = await Otp.findOne({ businessId: business._id, mobile, consumedAt: null, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
  if (!otp || otp.attempts >= MAX_ATTEMPTS) return false;

  const expected = Buffer.from(otp.codeHash, "hex");
  const actual = Buffer.from(hashCode(mobile, code), "hex");
  const valid = expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  if (!valid) {
    await Otp.updateOne({ _id: otp._id }, { $inc: { attempts: 1 } });
    return false;
  }

  if (consume) await Otp.updateOne({ _id: otp._id }, { $set: { consumedAt: new Date() } });
  return true;
}

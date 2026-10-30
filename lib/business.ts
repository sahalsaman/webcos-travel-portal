import { cache } from "react";
import { headers } from "next/headers";
import mongoose from "mongoose";
import { configuredPlatformDatabase, connectDB } from "@/lib/db";
import { getToken } from "next-auth/jwt";
import Business from "@/models/Business";

export interface BusinessRecord {
  _id: mongoose.Types.ObjectId;
  name: string; slug: string; 
  hosts: string[];
  siteUrl: string; address?: string; businessEmail?: string; businessPhoneCountryCode?: string; businessPhone?: string; BusinessWhatsappCountryCode?: string; businessWhatsapp?: string; currency?: string; logoUrl: string; primaryColor: string; status: string;
  subscription?: { plan: string; status: "trial" | "active" | "past_due" | "cancelled"; amount: number; setupFee?: number; setupPaidAmount?: number; setupPaidAt?: Date | null; startedAt?: Date | null; currency: string; renewsAt?: Date | null };
  credentials?: Array<{ platform: "CLOUDINARY" | "WABIS_API" | "RAZORPAY_API" | "FLIGHT_API" | "GEMINI_AI" | "META_API"; name?: string; apikey?: string; secretKey?: string; url?: string; webhookSecret?: string; alertEmail?: string }>;
}

export type BusinessCredential = NonNullable<BusinessRecord["credentials"]>[number];

function brandLogoFor(business: BusinessRecord) {
  return business.logoUrl;
}
export async function businessModel() {
  await connectDB();
  const db = mongoose.connection.useDb(configuredPlatformDatabase(), { useCache: true });
  return db.models.Business || db.model("Business", Business.schema);
}
export const getBusiness = cache(async (): Promise<BusinessRecord> => {
  const h = await headers();
  const slug = h.get("x-business-slug");
  const host = (h.get("host") || "").toLowerCase();
  const businesses = await businessModel();
  let business = await businesses.findOne(slug ? { slug, status: "active" } : { hosts: host, status: "active" }).lean();
  if (!business && !slug) {
    const secureCookie = process.env.NODE_ENV === "production" || h.get("cookie")?.includes("__Secure-authjs.session-token");
    const token = await getToken({ req: { headers: h } as never, secret: process.env.AUTH_SECRET, secureCookie });
    if (token?.businessId) business = await businesses.findOne({ _id: token.businessId, status: "active" }).lean();
  }
  if (!business) throw new Error("Unknown or suspended business. Use your agency's portal address.");
  return business as unknown as BusinessRecord;
});

/** Credentials are read from the registry directly so hot-reloaded schemas never hide them. */
export async function getBusinessCredentials(business?: BusinessRecord): Promise<BusinessCredential[]> {
  const current = business ?? await getBusiness();
  await connectDB();
  const db = mongoose.connection.useDb(configuredPlatformDatabase(), { useCache: true });
  const record = await db.collection("businesses").findOne({ _id: current._id }, { projection: { credentials: 1 } });
  return (record?.credentials ?? current.credentials ?? []) as BusinessCredential[];
}
export async function getBrand() {
  const b = await getBusiness();
  return { name: b.name, logoUrl: brandLogoFor(b), primaryColor: b.primaryColor, siteUrl: b.siteUrl };
}

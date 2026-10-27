import { cache } from "react";
import { headers } from "next/headers";
import mongoose, { Schema } from "mongoose";
import { configuredPlatformDatabase, connectDB } from "@/lib/db";
import { getToken } from "next-auth/jwt";
import { CREDENTIOL_PLATFORM } from "@/lib/constants";

const businessSchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  databaseName: { type: String, required: true, unique: true },
  hosts: { type: [String], required: true, unique: true },
  siteUrl: { type: String, required: true },
  address: { type: String, default: "" },
  ownerName: { type: String, default: "", trim: true },
  email: { type: String, default: "", trim: true, lowercase: true },
  phone: { type: String, default: "", trim: true },
  logoUrl: { type: String, default: "" },
  primaryColor: { type: String, default: "#0060e6" },
  credentials: [{
    platform: { type: String, enum: CREDENTIOL_PLATFORM, required: true },
    name: { type: String, trim: true, default: "" },
    apikey: { type: String, trim: true, default: "" },
    secretKey: { type: String, trim: true, default: "" },
    url: { type: String, trim: true, default: "" },
  }],
  provisioned: { type: Boolean, default: false },
  status: { type: String, enum: ["active", "suspended"], default: "active" },
  subscription: {
    plan: { type: String, default: "Starter" },
    status: { type: String, enum: ["trial", "active", "past_due", "cancelled"], default: "trial" },
    amount: { type: Number, default: 0, min: 0 },
    setupFee: { type: Number, default: 0, min: 0 },
    setupPaidAmount: { type: Number, default: 0, min: 0 },
    setupPaidAt: { type: Date, default: null },
    currency: { type: String, default: "INR" },
    renewsAt: { type: Date, default: null },
  },
}, { timestamps: true });

export interface BusinessRecord {
  _id: mongoose.Types.ObjectId;
  name: string; slug: string; databaseName: string; hosts: string[];
  siteUrl: string; address?: string; ownerName?: string; email?: string; phone?: string; logoUrl: string; primaryColor: string; status: string;
  subscription?: { plan: string; status: "trial" | "active" | "past_due" | "cancelled"; amount: number; setupFee?: number; setupPaidAmount?: number; setupPaidAt?: Date | null; currency: string; renewsAt?: Date | null };
  credentials?: Array<{ platform: "CLOUDINARY" | "WHATSAPP_BUSINESS" | "PAYMENT_GATEWAY" | "FLIGHT_API" | "GEMINI_AI"; name?: string; apikey?: string; secretKey?: string; url?: string }>;
}

export type BusinessCredential = NonNullable<BusinessRecord["credentials"]>[number];

function brandLogoFor(business: BusinessRecord) {
  return business.logoUrl;
}
export async function businessModel() {
  await connectDB();
  const db = mongoose.connection.useDb(configuredPlatformDatabase(), { useCache: true });
  return db.models.Business || db.model("Business", businessSchema);
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

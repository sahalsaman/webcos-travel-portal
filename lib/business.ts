import { cache } from "react";
import { headers } from "next/headers";
import mongoose, { Schema } from "mongoose";
import { configuredPlatformDatabase, connectDB } from "@/lib/db";
import { getToken } from "next-auth/jwt";

const businessSchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  databaseName: { type: String, required: true, unique: true },
  hosts: { type: [String], required: true, unique: true },
  siteUrl: { type: String, required: true },
  logoUrl: { type: String, default: "" },
  primaryColor: { type: String, default: "#0060e6" },
  provisioned: { type: Boolean, default: false },
  status: { type: String, enum: ["active", "suspended"], default: "active" },
}, { timestamps: true });

export interface BusinessRecord {
  _id: mongoose.Types.ObjectId;
  name: string; slug: string; databaseName: string; hosts: string[];
  siteUrl: string; logoUrl: string; primaryColor: string; status: string;
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
    const token = await getToken({ req: { headers: h } as never, secret: process.env.AUTH_SECRET });
    if (token?.businessId) business = await businesses.findOne({ _id: token.businessId, status: "active" }).lean();
  }
  if (!business) throw new Error("Unknown or suspended business. Use your agency's portal address.");
  return business as unknown as BusinessRecord;
});
export async function getBrand() {
  const b = await getBusiness();
  return { name: b.name, logoUrl: b.logoUrl, primaryColor: b.primaryColor, siteUrl: b.siteUrl };
}

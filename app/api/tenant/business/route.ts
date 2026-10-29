import mongoose from "mongoose";
import { z } from "zod";
import { getBusiness } from "@/lib/business";
import { configuredPlatformDatabase, configuredTenantDatabase, connectDB } from "@/lib/db";
import { fail, handleError, ok, requireApiRole } from "@/lib/api";
import { collectCloudinaryUrls, removeUnusedCloudinaryImages } from "@/lib/cloudinary-media";

const businessSchema = z.object({
  name: z.string().trim().min(2, "Business name must be at least 2 characters").max(120),
  siteUrl: z.url("Enter a valid website URL").max(500),
  address: z.string().trim().max(500).default(""),
  email: z.union([z.literal(""), z.email("Enter a valid email address")]).default(""),
  phone: z.string().trim().max(40).default(""),
  phoneCountryCode: z.string().trim().max(8).default("+91"),
  whatsapp: z.string().trim().max(40).default(""),
  whatsappCountryCode: z.string().trim().max(8).default("+91"),
  currency: z.string().trim().length(3).default("INR"),
  logoUrl: z.union([z.literal(""), z.url("Choose a valid logo image")]).default(""),
});

export async function PATCH(request: Request) {
  try {
    await requireApiRole(["tenant", "tenant_employee"]);
    const data = businessSchema.parse(await request.json());
    const business = await getBusiness();
    await connectDB();
    const db = mongoose.connection.useDb(configuredPlatformDatabase(), { useCache: true });
    const previous = await db.collection("businesses").findOne({ _id: business._id }, { projection: { logoUrl: 1 } });
    const result = await db.collection("businesses").findOneAndUpdate(
      { _id: business._id },
      { $set: { name: data.name, siteUrl: data.siteUrl, address: data.address, businessEmail: data.email, businessPhone: data.phone, businessPhoneCountryCode: data.phoneCountryCode, businessWhatsapp: data.whatsapp, BusinessWhatsappCountryCode: data.whatsappCountryCode, currency: data.currency.toUpperCase(), logoUrl: data.logoUrl, updatedAt: new Date() } },
      { returnDocument: "after", projection: { name: 1, slug: 1, siteUrl: 1, address: 1, businessEmail: 1, businessPhone: 1, businessPhoneCountryCode: 1, businessWhatsapp: 1, BusinessWhatsappCountryCode: 1, currency: 1, logoUrl: 1, status: 1 } },
    );
    if (!result) return fail("Business not found", 404);
    // Keep the tenant operational currency in sync with the business profile.
    await mongoose.connection.useDb(configuredTenantDatabase(), { useCache: true }).collection("settings").updateOne({ businessId: business._id }, { $set: { currency: data.currency.toUpperCase(), updatedAt: new Date() } });
    if (previous) await removeUnusedCloudinaryImages(collectCloudinaryUrls(previous));
    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}

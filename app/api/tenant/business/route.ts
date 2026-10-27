import mongoose from "mongoose";
import { z } from "zod";
import { getBusiness } from "@/lib/business";
import { configuredPlatformDatabase, connectDB } from "@/lib/db";
import { fail, handleError, ok, requireApiRole } from "@/lib/api";
import { collectCloudinaryUrls, removeUnusedCloudinaryImages } from "@/lib/cloudinary-media";

const businessSchema = z.object({
  name: z.string().trim().min(2, "Business name must be at least 2 characters").max(120),
  siteUrl: z.url("Enter a valid website URL").max(500),
  address: z.string().trim().max(500).default(""),
  email: z.union([z.literal(""), z.email("Enter a valid email address")]).default(""),
  phone: z.string().trim().max(40).default(""),
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
      { $set: { ...data, updatedAt: new Date() } },
      { returnDocument: "after", projection: { name: 1, slug: 1, siteUrl: 1, address: 1, email: 1, phone: 1, logoUrl: 1, status: 1 } },
    );
    if (!result) return fail("Business not found", 404);
    if (previous) await removeUnusedCloudinaryImages(collectCloudinaryUrls(previous));
    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}

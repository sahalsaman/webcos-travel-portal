import { z } from "zod";
import mongoose from "mongoose";
import { CREDENTIOL_PLATFORM } from "@/lib/constants";
import { getBusiness, getBusinessCredentials } from "@/lib/business";
import { configuredPlatformDatabase, connectDB } from "@/lib/db";
import { handleError, ok, requireApiRole } from "@/lib/api";

const credentialSchema = z.object({
  platform: z.enum(CREDENTIOL_PLATFORM),
  name: z.string().trim().max(120).default(""),
  apikey: z.string().trim().max(500).default(""),
  secretKey: z.string().trim().max(500).default(""),
  url: z.string().trim().max(500).default(""),
});

export async function GET() {
  try {
    await requireApiRole(["admin"]);
    const business = await getBusiness();
    // Read the registry collection directly. This remains reliable during
    // development hot reloads where an older compiled Mongoose schema may
    // otherwise omit a newly introduced field.
    return ok({ credentials: await getBusinessCredentials(business) });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await requireApiRole(["admin"]);
    const { credentials } = z.object({ credentials: z.array(credentialSchema).max(10) }).parse(await request.json());
    const business = await getBusiness();
    await connectDB();
    const db = mongoose.connection.useDb(configuredPlatformDatabase(), { useCache: true });
    const result = await db.collection("businesses").updateOne({ _id: business._id }, { $set: { credentials, updatedAt: new Date() } });
    if (!result.matchedCount) throw new Error("Business not found");
    return ok({ credentials });
  } catch (error) {
    return handleError(error);
  }
}

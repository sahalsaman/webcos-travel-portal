import { cloudinaryConfig, CloudinaryUploadError } from "@/lib/cloudinary";
import { fail, handleError, ok, requireApiRole } from "@/lib/api";

export async function POST() {
  try {
    await requireApiRole(["admin"]);
    const config = await cloudinaryConfig();
    if (!config) return fail("Add Cloudinary credentials first.", 422);
    const authorization = `Basic ${Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64")}`;
    const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/resources/image?max_results=1`, { headers: { Authorization: authorization } });
    if (!response.ok) return fail("Cloudinary rejected these credentials. Check the cloud name, API key, and API secret.", 422);
    return ok({ connected: true });
  } catch (error) {
    if (error instanceof CloudinaryUploadError) return fail(error.message, 422);
    return handleError(error);
  }
}

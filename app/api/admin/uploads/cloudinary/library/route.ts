import { CloudinaryUploadError, listCloudinaryImages } from "@/lib/cloudinary";
import { fail, handleError, ok, requireApiRole } from "@/lib/api";

export async function GET(request: Request) {
  try {
    await requireApiRole(["admin"]);
    const cursor = new URL(request.url).searchParams.get("cursor")?.trim();
    return ok(await listCloudinaryImages(12, cursor || undefined));
  } catch (error) {
    if (error instanceof CloudinaryUploadError) return fail(error.message, 422);
    return handleError(error);
  }
}

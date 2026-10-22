import { CloudinaryUploadError, uploadPackageImageFile } from "@/lib/cloudinary";
import { fail, handleError, ok, requireApiRole } from "@/lib/api";

export async function POST(request: Request) {
  try {
    await requireApiRole(["admin"]);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return fail("Select an image to upload.", 422);
    return ok({ url: await uploadPackageImageFile(file) }, 201);
  } catch (error) {
    if (error instanceof CloudinaryUploadError) return fail(error.message, 422);
    return handleError(error);
  }
}

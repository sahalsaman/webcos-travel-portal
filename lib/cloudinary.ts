import crypto from "node:crypto";
import { getBusiness, getBusinessCredentials } from "@/lib/business";

export class CloudinaryUploadError extends Error {}

type CloudinaryConfig = { cloudName: string; apiKey: string; apiSecret: string; folder: string };

function safeCloudName(value: string) {
  return /^[a-z0-9_-]+$/i.test(value);
}

export async function cloudinaryConfig(): Promise<CloudinaryConfig | null> {
  const business = await getBusiness();
  const credential = (await getBusinessCredentials(business)).find((item) => item.platform === "CLOUDINARY");
  const cloudName = credential?.name?.trim() ?? "";
  const apiKey = credential?.apikey?.trim() ?? "";
  const apiSecret = credential?.secretKey?.trim() ?? "";
  const folder = (credential?.url?.trim() || "travel-packages").replace(/^\/+|\/+$/g, "");

  if (!cloudName && !apiKey && !apiSecret) return null;
  if (!safeCloudName(cloudName) || !apiKey || !apiSecret) {
    throw new CloudinaryUploadError("Complete the Cloudinary cloud name, API key, and API secret in Settings before uploading images.");
  }
  if (!/^[a-zA-Z0-9_\-/]+$/.test(folder)) {
    throw new CloudinaryUploadError("Cloudinary upload folder can only contain letters, numbers, dashes, underscores, and slashes.");
  }
  return { cloudName, apiKey, apiSecret, folder };
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export async function uploadExternalPackageImages(images: string[]) {
  const clean = [...new Set(images.map((value) => value.trim()).filter(Boolean))];
  if (!clean.length) return clean;
  if (clean.some((url) => !isHttpUrl(url))) throw new CloudinaryUploadError("Package images must be valid http or https URLs.");

  const config = await cloudinaryConfig();
  const ownHost = config ? `res.cloudinary.com/${config.cloudName}/` : "";
  const needingUpload = clean.filter((url) => !ownHost || !url.includes(ownHost));
  if (!needingUpload.length) return clean;
  if (!config) throw new CloudinaryUploadError("Configure Cloudinary in Settings before adding external image links.");

  const uploaded = await Promise.all(needingUpload.map(async (sourceUrl) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = crypto.createHash("sha1").update(`folder=${config.folder}&timestamp=${timestamp}${config.apiSecret}`).digest("hex");
    const form = new FormData();
    form.set("file", sourceUrl);
    form.set("api_key", config.apiKey);
    form.set("timestamp", String(timestamp));
    form.set("folder", config.folder);
    form.set("signature", signature);
    const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, { method: "POST", body: form });
    const data = await response.json() as { secure_url?: string; error?: { message?: string } };
    if (!response.ok || !data.secure_url) throw new CloudinaryUploadError(data.error?.message || "Cloudinary could not upload one of the image links.");
    return data.secure_url;
  }));

  let uploadIndex = 0;
  return clean.map((url) => url.includes(ownHost) ? url : uploaded[uploadIndex++]);
}

/** Upload a file selected in the tenant portal into that tenant's Cloudinary folder. */
export async function uploadPackageImageFile(file: File) {
  const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
  if (!allowed.has(file.type)) throw new CloudinaryUploadError("Upload a JPG, PNG, WebP, or AVIF image.");
  if (file.size <= 0 || file.size > 2 * 1024 * 1024) throw new CloudinaryUploadError("Each image must be smaller than 2 MB.");
  const config = await cloudinaryConfig();
  if (!config) throw new CloudinaryUploadError("Configure Cloudinary in Settings before uploading images.");

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto.createHash("sha1").update(`folder=${config.folder}&timestamp=${timestamp}${config.apiSecret}`).digest("hex");
  const form = new FormData();
  form.set("file", file, file.name);
  form.set("api_key", config.apiKey);
  form.set("timestamp", String(timestamp));
  form.set("folder", config.folder);
  form.set("signature", signature);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, { method: "POST", body: form });
  const data = await response.json() as { secure_url?: string; error?: { message?: string } };
  if (!response.ok || !data.secure_url) throw new CloudinaryUploadError(data.error?.message || "Cloudinary could not upload this image.");
  return data.secure_url;
}

/** Return the latest images in this tenant's configured Cloudinary folder. */
export async function listCloudinaryImages(limit = 12, nextCursor?: string) {
  const config = await cloudinaryConfig();
  if (!config) throw new CloudinaryUploadError("Configure Cloudinary in Settings before choosing images.");
  const authorization = `Basic ${Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64")}`;
  const query = new URLSearchParams({ max_results: String(Math.min(Math.max(limit, 1), 100)), direction: "desc", prefix: config.folder });
  if (nextCursor) query.set("next_cursor", nextCursor);
  // Cloudinary requires an explicit delivery type whenever resources are
  // filtered by a folder prefix. Omitting `/upload` returns a 400 response
  // even though unfiltered image listing succeeds.
  const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/resources/image/upload?${query}`, { headers: { Authorization: authorization }, cache: "no-store" });
  const data = await response.json() as { resources?: Array<{ secure_url?: string }>; next_cursor?: string; error?: { message?: string } };
  if (!response.ok) throw new CloudinaryUploadError(data.error?.message || "Cloudinary could not load your image library.");
  return {
    images: (data.resources ?? []).map((item) => item.secure_url).filter((url): url is string => Boolean(url)),
    nextCursor: data.next_cursor ?? null,
  };
}

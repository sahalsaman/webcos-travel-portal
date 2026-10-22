import crypto from "node:crypto";
import mongoose from "mongoose";
import { getBusiness } from "@/lib/business";
import { configuredPlatformDatabase } from "@/lib/db";
import { tenantModel } from "@/lib/tenant-db";
import { cloudinaryConfig } from "@/lib/cloudinary";
import Activity from "@/models/Activity";
import Destination from "@/models/Destination";
import Hotel from "@/models/Hotel";
import OfferCard from "@/models/OfferCard";
import Trip from "@/models/Trip";
import Vehicle from "@/models/Vehicle";

/** Return Cloudinary URLs found anywhere in an entity before it is changed/deleted. */
export function collectCloudinaryUrls(value: unknown): string[] {
  const found = new Set<string>();
  const visit = (item: unknown) => {
    if (typeof item === "string") { if (item.includes("res.cloudinary.com/")) found.add(item); return; }
    if (Array.isArray(item)) { item.forEach(visit); return; }
    if (item && typeof item === "object") Object.values(item as Record<string, unknown>).forEach(visit);
  };
  visit(value);
  return [...found];
}

function publicIdFromUrl(url: string, cloudName: string, folder: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== `res.cloudinary.com`) return null;
    const marker = `/${cloudName}/image/upload/`;
    const start = parsed.pathname.indexOf(marker);
    if (start < 0) return null;
    const path = parsed.pathname.slice(start + marker.length).replace(/^v\d+\//, "");
    const publicId = path.replace(/\.[a-z0-9]+$/i, "");
    return publicId === folder || publicId.startsWith(`${folder}/`) ? publicId : null;
  } catch { return null; }
}

async function isReferenced(url: string) {
  const [trips, destinations, activities, hotels, vehicles, offers, business] = await Promise.all([
    tenantModel(Trip), tenantModel(Destination), tenantModel(Activity), tenantModel(Hotel), tenantModel(Vehicle), tenantModel(OfferCard), getBusiness(),
  ]);
  const checks = await Promise.all([
    trips.exists({ $or: [{ images: url }, { "itinerary.highlights.image": url }, { "itinerary.sightseeing.image": url }, { "itinerary.activity.image": url }] }),
    destinations.exists({ images: url }),
    activities.exists({ images: url }),
    hotels.exists({ image: url }),
    vehicles.exists({ image: url }),
    offers.exists({ images: url }),
    mongoose.connection.useDb(configuredPlatformDatabase(), { useCache: true }).collection("businesses").findOne({ _id: business._id, logoUrl: url }),
  ]);
  return checks.some(Boolean);
}

/**
 * Permanently removes only vendor-folder assets that no longer appear in any
 * supported content record. Failures are logged; a completed content update is
 * never rolled back because Cloudinary housekeeping temporarily failed.
 */
export async function removeUnusedCloudinaryImages(candidates: string[]) {
  const config = await cloudinaryConfig();
  if (!config) return;
  for (const url of [...new Set(candidates)]) {
    const publicId = publicIdFromUrl(url, config.cloudName, config.folder);
    if (!publicId || await isReferenced(url)) continue;
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = crypto.createHash("sha1").update(`public_id=${publicId}&timestamp=${timestamp}${config.apiSecret}`).digest("hex");
      const body = new URLSearchParams({ public_id: publicId, timestamp: String(timestamp), api_key: config.apiKey, signature });
      const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/destroy`, { method: "POST", body });
      if (!response.ok) console.error("[cloudinary] could not delete unused image", publicId);
    } catch (error) { console.error("[cloudinary] cleanup failed", error); }
  }
}

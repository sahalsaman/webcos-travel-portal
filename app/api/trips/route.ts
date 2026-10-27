import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { ok, fail, handleError, requireApiRole } from "@/lib/api";
import { tripSchema } from "@/lib/validations";
import { CloudinaryUploadError, uploadExternalPackageImages } from "@/lib/cloudinary";
import { slugify } from "@/lib/utils";
import { COUNTRY_OPTIONS } from "@/lib/constants";
import "@/models";
import Trip from "@/models/Trip";
import Destination from "@/models/Destination";

async function uniqueTripSlug(title: string) {
  const root = slugify(title) || "trip";
  let slug = root;
  let i = 1;
  while (await (await tenantModel(Trip)).exists({ slug })) slug = `${root}-${i++}`;
  return slug;
}

async function ensureTenantDestination(data: { destination: string; country: string; description: string; images: string[]; basePrice: number; tags: string[] }) {
  const DestinationModel = await tenantModel(Destination);
  const existing = await DestinationModel.exists({ title: data.destination, country: data.country });
  if (existing) return;
  const countryCode = COUNTRY_OPTIONS.find((country) => country.name === data.country)?.code ?? "IN";
  await DestinationModel.create({ title: data.destination, country: data.country, countryCode, description: data.description, images: data.images, basePrice: data.basePrice, tags: data.tags, status: "active", featured: false, popular: false });
}

/** Admin: list all trips (any status) with optional ?status & ?q. */
export async function GET(request: Request) {
  try {
    await requireApiRole(["tenant", "tenant_employee"]);
    await connectDB();
    const { searchParams } = new URL(request.url);
    const query: Record<string, unknown> = {};
    const status = searchParams.get("status");
    const q = searchParams.get("q");
    if (status) query.status = status;
    if (q) query.title = new RegExp(q, "i");

    const trips = await (await tenantModel(Trip)).find(query).sort({ createdAt: -1 }).lean();
    return ok(trips);
  } catch (err) {
    return handleError(err);
  }
}

/** Admin: create a trip. */
export async function POST(request: Request) {
  try {
    await requireApiRole(["tenant", "tenant_employee"]);
    const body = await request.json();
    const data = tripSchema.parse({ ...body, images: await uploadExternalPackageImages(body.images ?? []) });
    await connectDB();

    await ensureTenantDestination(data);

    const slug = await uniqueTripSlug(data.title);
    const trip = await (await tenantModel(Trip)).create({
      ...data,
      supplier: data.supplier || null,
      slug,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      availableSeats: data.availableSeats || data.totalSeats,
    });
    return ok({ id: String(trip._id), slug }, 201);
  } catch (err) {
    if (err instanceof CloudinaryUploadError) return fail(err.message, 422);
    return handleError(err);
  }
}

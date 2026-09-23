import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { ok, handleError, requireApiRole } from "@/lib/api";
import { tripSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import "@/models";
import Trip from "@/models/Trip";

async function uniqueTripSlug(title: string) {
  const root = slugify(title) || "trip";
  let slug = root;
  let i = 1;
  while (await (await tenantModel(Trip)).exists({ slug })) slug = `${root}-${i++}`;
  return slug;
}

/** Admin: list all trips (any status) with optional ?status & ?q. */
export async function GET(request: Request) {
  try {
    await requireApiRole(["admin"]);
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
    await requireApiRole(["admin"]);
    const data = tripSchema.parse(await request.json());
    await connectDB();

    const slug = await uniqueTripSlug(data.title);
    const trip = await (await tenantModel(Trip)).create({
      ...data,
      slug,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      availableSeats: data.availableSeats || data.totalSeats,
    });
    return ok({ id: String(trip._id), slug }, 201);
  } catch (err) {
    return handleError(err);
  }
}

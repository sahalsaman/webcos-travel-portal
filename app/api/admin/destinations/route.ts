import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { ok, handleError, requireApiRole } from "@/lib/api";
import { destinationSchema } from "@/lib/validations";
import "@/models";
import Destination from "@/models/Destination";

export async function GET() {
  try {
    await requireApiRole(["admin"]);
    await connectDB();
    const destinations = await (await tenantModel(Destination)).find({}).sort({ featured: -1, createdAt: -1 }).lean();
    return ok(destinations);
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: Request) {
  try {
    await requireApiRole(["admin"]);
    const data = destinationSchema.parse(await request.json());
    await connectDB();
    const destination = await (await tenantModel(Destination)).create({ ...data, countryCode: data.countryCode.toUpperCase() });
    return ok({ id: String(destination._id) }, 201);
  } catch (err) {
    return handleError(err);
  }
}

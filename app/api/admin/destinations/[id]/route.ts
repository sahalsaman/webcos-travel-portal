import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { ok, fail, handleError, requireApiRole } from "@/lib/api";
import { destinationSchema } from "@/lib/validations";
import "@/models";
import Destination from "@/models/Destination";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    await requireApiRole(["admin"]);
    const { id } = await params;
    const data = destinationSchema.partial().parse(await request.json());
    await connectDB();
    const update = data.countryCode ? { ...data, countryCode: data.countryCode.toUpperCase() } : data;
    const destination = await (await tenantModel(Destination)).findByIdAndUpdate(id, update, { new: true }).lean();
    if (!destination) return fail("Destination not found", 404);
    return ok(destination);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    await requireApiRole(["admin"]);
    const { id } = await params;
    await connectDB();
    const destination = await (await tenantModel(Destination)).findByIdAndDelete(id);
    if (!destination) return fail("Destination not found", 404);
    return ok({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}

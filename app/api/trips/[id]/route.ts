import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { ok, fail, handleError, requireApiRole } from "@/lib/api";
import { tripUpdateSchema } from "@/lib/validations";
import "@/models";
import Trip from "@/models/Trip";

type Ctx = { params: Promise<{ id: string }> };

/** Admin: update a trip. */
export async function PATCH(request: Request, { params }: Ctx) {
  try {
    await requireApiRole(["admin"]);
    const { id } = await params;
    const data = tripUpdateSchema.parse(await request.json());
    await connectDB();

    const update: Record<string, unknown> = { ...data };
    if (data.startDate) update.startDate = new Date(data.startDate);
    if (data.endDate) update.endDate = new Date(data.endDate);

    const trip = await (await tenantModel(Trip)).findByIdAndUpdate(id, update, { new: true }).lean();
    if (!trip) return fail("Package not found", 404);
    return ok(trip);
  } catch (err) {
    return handleError(err);
  }
}

/** Admin: delete a trip. */
export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    await requireApiRole(["admin"]);
    const { id } = await params;
    await connectDB();
    const res = await (await tenantModel(Trip)).findByIdAndDelete(id);
    if (!res) return fail("Package not found", 404);
    return ok({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}

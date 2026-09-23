import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { fail, handleError, ok, requireApiRole } from "@/lib/api";
import { ACTIVITY_BOOKING_STATUSES } from "@/lib/constants";
import ActivityBooking from "@/models/ActivityBooking";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Ctx) {
  try {
    await requireApiRole(["admin", "employee"]);
    const { id } = await params;
    const data = z.object({ status: z.enum(ACTIVITY_BOOKING_STATUSES) }).parse(await request.json());
    await connectDB();
    const item = await (await tenantModel(ActivityBooking)).findByIdAndUpdate(id, data, { new: true }).lean();
    return item ? ok(item) : fail("Activity booking not found", 404);
  } catch (error) { return handleError(error); }
}

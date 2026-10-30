import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { fail, handleError, ok, requireApiRole } from "@/lib/api";
import { ACTIVITY_BOOKING_STATUSES } from "@/lib/constants";
import ActivityBooking from "@/models/ActivityBooking";
import { notifyAdminsAndEmployees } from "@/lib/notifications";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: Ctx) {
  try {
    await requireApiRole(["tenant", "tenant_employee"]);
    const { id } = await params;
    const data = z.object({ status: z.enum(ACTIVITY_BOOKING_STATUSES) }).parse(await request.json());
    await connectDB();
    const ActivityBookingModel = await tenantModel(ActivityBooking);
    const previous = await ActivityBookingModel.findById(id).select("status activity").lean();
    if (!previous) return fail("Activity booking not found", 404);
    const item = await ActivityBookingModel.findByIdAndUpdate(id, data, { new: true }).lean();
    if (item && previous.status !== item.status) {
      await notifyAdminsAndEmployees({
        type: "booking",
        title: "Activity booking status changed",
        message: `An activity booking changed from ${previous.status} to ${item.status}.`,
        meta: { activityBookingId: String(item._id), status: item.status, href: "/lms/activity-bookings" },
      }, "lms");
    }
    return ok(item);
  } catch (error) { return handleError(error); }
}

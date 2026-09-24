import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { currentUser, fail, handleError, ok } from "@/lib/api";
import { activityBookingSchema } from "@/lib/validations";
import { shortId } from "@/lib/utils";
import Activity from "@/models/Activity";
import ActivityBooking from "@/models/ActivityBooking";
import { notifyAdminsAndEmployees } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    const data = activityBookingSchema.parse(await request.json());
    await connectDB();
    const activity = await (await tenantModel(Activity)).findOne({ _id: data.activityId, status: "active" }).lean();
    if (!activity) return fail("This activity is not available", 404);
    const totalParticipants = data.adults + data.children;
    const bookingNumber = shortId("ACT-");
    const booking = await (await tenantModel(ActivityBooking)).create({
      ...data,
      activity: activity._id,
      traveler: user?.role === "vendor_traveler" ? user.id : null,
      activityDate: new Date(`${data.activityDate}T00:00:00.000Z`),
      totalParticipants,
      unitPrice: activity.basePrice,
      totalAmount: activity.basePrice * totalParticipants,
      bookingNumber,
    });
    await notifyAdminsAndEmployees({ type: "booking", title: "New activity booking", message: `${bookingNumber} · ${activity.title} · ${data.name}`, meta: { activityBookingId: String(booking._id), href: "/admin/lms/activity-bookings" } }, "lms");
    return ok({ bookingNumber, id: String(booking._id) }, 201);
  } catch (error) { return handleError(error); }
}

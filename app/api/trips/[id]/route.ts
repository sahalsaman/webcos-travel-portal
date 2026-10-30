import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { ok, fail, handleError, requireApiRole } from "@/lib/api";
import { tripUpdateSchema } from "@/lib/validations";
import { CloudinaryUploadError, uploadExternalPackageImages } from "@/lib/cloudinary";
import { collectCloudinaryUrls, removeUnusedCloudinaryImages } from "@/lib/cloudinary-media";
import "@/models";
import Booking from "@/models/Booking";
import PartnerTrip from "@/models/PartnerTrip";
import Trip from "@/models/Trip";
import { dateDrivenTripStatus } from "@/lib/fixed-departure-status";
import { notifyAdminsAndEmployees } from "@/lib/notifications";

type Ctx = { params: Promise<{ id: string }> };

/** Admin: update a trip. */
export async function PATCH(request: Request, { params }: Ctx) {
  try {
    await requireApiRole(["tenant", "tenant_employee"]);
    const { id } = await params;
    const body = await request.json();
    const data = tripUpdateSchema.parse({ ...body, ...(body.images !== undefined ? { images: await uploadExternalPackageImages(body.images) } : {}) });
    await connectDB();

    const update: Record<string, unknown> = { ...data, ...(data.supplier !== undefined ? { supplier: data.supplier || null } : {}) };
    if (data.startDate) update.startDate = new Date(data.startDate);
    if (data.endDate) update.endDate = new Date(data.endDate);

    const TripModel = await tenantModel(Trip);
    const previous = await TripModel.findById(id).lean();
    if (!previous) return fail("Package not found", 404);
    const nextStatus = (update.status as string | undefined) ?? previous.status;
    const dateStatus = dateDrivenTripStatus({
      ...previous,
      ...update,
      status: nextStatus,
      startDate: (update.startDate as Date | undefined) ?? previous.startDate,
      endDate: (update.endDate as Date | undefined) ?? previous.endDate,
      holidayPackage: (update.holidayPackage as boolean | undefined) ?? previous.holidayPackage,
    });
    if (dateStatus) update.status = dateStatus;

    const trip = await TripModel.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!trip) return fail("Package not found", 404);
    if (previous.status !== trip.status) {
      await notifyAdminsAndEmployees({
        type: "system",
        title: "Package status changed",
        message: `“${trip.title}” changed from ${previous.status} to ${trip.status}.`,
        meta: { href: "/inventory/packages", packageId: String(trip._id), status: trip.status },
      }, "inventory");
    }
    await removeUnusedCloudinaryImages(collectCloudinaryUrls(previous));
    return ok(trip);
  } catch (err) {
    if (err instanceof CloudinaryUploadError) return fail(err.message, 422);
    return handleError(err);
  }
}

/** Delete a package only while no traveler booking references it. */
export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    await requireApiRole(["tenant", "tenant_employee"]);
    const { id } = await params;
    await connectDB();
    const BookingModel = await tenantModel(Booking);
    const hasBookings = await BookingModel.exists({ trip: id });
    if (hasBookings) return fail("This package cannot be deleted because it has customer bookings.", 409);

    const TripModel = await tenantModel(Trip);
    const res = await TripModel.findByIdAndDelete(id);
    if (!res) return fail("Package not found", 404);
    await (await tenantModel(PartnerTrip)).deleteMany({ trip: id });
    await removeUnusedCloudinaryImages(collectCloudinaryUrls(res));
    return ok({ deleted: true });
  } catch (err) {
    return handleError(err);
  }
}

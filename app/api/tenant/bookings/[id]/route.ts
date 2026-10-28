import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { ok, fail, handleError, requireApiRole } from "@/lib/api";
import { adminBookingTravelerSchema } from "@/lib/validations";
import "@/models";
import Booking from "@/models/Booking";
import User from "@/models/User";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    await requireApiRole(["tenant", "tenant_employee"]);
    const { id } = await params;
    const data = adminBookingTravelerSchema.parse(await request.json());
    await connectDB();

    const booking = await (await tenantModel(Booking)).findById(id);
    if (!booking) return fail("Booking not found", 404);
    if (data.totalAmount < Number(booking.partnerEarnings || 0)) {
      return fail("Booking amount cannot be lower than the partner earnings", 400);
    }

    const travelerEmail = data.travelerDetails.email.toLowerCase();
    const existingTraveler = await (await tenantModel(User)).findOne({ email: travelerEmail });
    if (existingTraveler && existingTraveler.role !== "tenant_traveler") {
      return fail("This email already belongs to a tenant or partner account", 409);
    }

    const traveler = await (await tenantModel(User)).findOneAndUpdate(
      { email: travelerEmail },
      {
        $setOnInsert: {
          email: travelerEmail,
          role: "tenant_traveler",
        },
        $set: {
          name: data.travelerDetails.name,
          phone: data.travelerDetails.phone,
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );

    booking.traveler = traveler._id;
    booking.travelerDetails = {
      ...data.travelerDetails,
      email: travelerEmail,
    };
    booking.totalAmount = data.totalAmount;
    booking.sellingPrice = data.totalAmount / booking.seats;
    booking.adminEarnings = data.totalAmount - Number(booking.partnerEarnings || 0);
    await booking.save();

    return ok({ id: String(booking._id), bookingNumber: booking.bookingNumber });
  } catch (err) {
    return handleError(err);
  }
}

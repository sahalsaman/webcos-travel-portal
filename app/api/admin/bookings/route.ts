import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { ok, fail, handleError, requireApiRole } from "@/lib/api";
import { adminManualBookingSchema } from "@/lib/validations";
import { shortId } from "@/lib/utils";
import "@/models";
import Booking from "@/models/Booking";
import Payment from "@/models/Payment";
import Trip from "@/models/Trip";
import User from "@/models/User";
import { isCustomDateTripCategory } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    await requireApiRole(["admin"]);
    const body = adminManualBookingSchema.parse(await request.json());
    await connectDB();

    const trip = await (await tenantModel(Trip)).findById(body.tripId);
    if (!trip || trip.status !== "active") return fail("This package is not available for booking", 404);
    if (trip.holidayPackage ?? isCustomDateTripCategory(trip.category)) {
      return fail("Custom-date bookings must be created through the customer booking flow", 400);
    }
    if (trip.availableSeats < body.seats) {
      return fail(`Only ${trip.availableSeats} seat(s) left`, 409);
    }

    const travelerEmail = body.travelerDetails.email.toLowerCase();
    const traveler = await (await tenantModel(User)).findOneAndUpdate(
      { email: travelerEmail },
      {
        $setOnInsert: {
          email: travelerEmail,
          role: "traveler",
        },
        $set: {
          name: body.travelerDetails.name,
          mobile: body.travelerDetails.mobile,
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );

    const totalAmount = trip.basePrice * body.seats;
    const bookingNumber = shortId("VOI-");

    const inventory = await (await tenantModel(Trip)).updateOne(
      { _id: trip._id, availableSeats: { $gte: body.seats } },
      { $inc: { availableSeats: -body.seats } },
    );
    if (inventory.modifiedCount !== 1) {
      const current = await (await tenantModel(Trip)).findById(trip._id).select("availableSeats").lean();
      return fail(`Only ${Number(current?.availableSeats || 0)} seat(s) left`, 409);
    }

    let booking;
    try {
      booking = await (await tenantModel(Booking)).create({
        bookingNumber,
        trip: trip._id,
        traveler: traveler._id,
        travelerDetails: {
          ...body.travelerDetails,
          travellers: body.travelerDetails.travellers || body.seats,
        },
        seats: body.seats,
        travelStartDate: trip.startDate,
        travelEndDate: trip.endDate,
        basePrice: trip.basePrice,
        commission: 0,
        platformFee: 0,
        sellingPrice: trip.basePrice,
        totalAmount,
        partnerEarnings: 0,
        adminEarnings: totalAmount,
        status: body.status,
        paymentStatus: body.paymentStatus,
        inventoryReserved: true,
      });
    } catch (error) {
      await (await tenantModel(Trip)).updateOne({ _id: trip._id }, { $inc: { availableSeats: body.seats } });
      throw error;
    }

    if (["created", "paid", "failed", "refunded"].includes(body.paymentStatus)) {
      const payment = await (await tenantModel(Payment)).create({
        booking: booking._id,
        amount: totalAmount,
        currency: "INR",
        status: body.paymentStatus,
        notes: { manual: true },
      });
      booking.payment = payment._id;
      await booking.save();
    }

    return ok({ id: String(booking._id), bookingNumber }, 201);
  } catch (err) {
    return handleError(err);
  }
}

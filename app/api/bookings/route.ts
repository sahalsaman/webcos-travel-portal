import { tenantModel } from "@/lib/tenant-db";
import { randomBytes } from "crypto";
import { connectDB } from "@/lib/db";
import { ok, fail, handleError, currentUser } from "@/lib/api";
import { bookingSchema } from "@/lib/validations";
import { calculateCommission } from "@/lib/commission";
import { shortId } from "@/lib/utils";
import {
  createOrder,
  paymentConfig,
} from "@/lib/razorpay";
import "@/models";
import Trip from "@/models/Trip";
import PartnerTrip from "@/models/PartnerTrip";
import Booking from "@/models/Booking";
import Payment from "@/models/Payment";
import User from "@/models/User";
import { getSettings } from "@/models/Settings";
import { isCustomDateTripCategory } from "@/lib/constants";
import { notifyAdminsAndEmployees } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    const body = bookingSchema.parse(await request.json());
    const gateway = await paymentConfig();
    if (body.bookingMode !== "offline" && !gateway.configured) return fail("Online payments are not configured. Please choose offline booking.", 503);
    await connectDB();

    const trip = await (await tenantModel(Trip)).findById(body.tripId);
    if (!trip || trip.status !== "active") {
      return fail("This package is not available for booking", 404);
    }
    for(const kind of ["visa","permit"] as const){const required=kind==="visa"?trip.visaRequired:trip.permitRequired;if(!required)continue;const answer=body.travelCompliance?.[kind];if(!answer)return fail(`${kind === "visa" ? "Visa" : "Permit"} information is required`,422);if(!answer.hasDocument){const wanted=(kind==="visa"?trip.visaDocuments:trip.permitDocuments)??[];const uploaded=new Set(answer.documents.map((document)=>document.label));if(wanted.some((label:string)=>!uploaded.has(label)))return fail(`Upload all required ${kind} documents`,422)}}
    const customDate = trip.holidayPackage ?? isCustomDateTripCategory(trip.category);
    if (!customDate && trip.availableSeats < body.seats) {
      return fail(`Only ${trip.availableSeats} seat(s) left`, 409);
    }

    // Resolve partner commission for white-label bookings.
    let commission = 0;
    let partnerId: string | null = null;
    let partnerTripId: string | null = null;
    if (body.partnerSlug) {
      const pt = await (await tenantModel(PartnerTrip)).findOne({
        partnerSlug: body.partnerSlug,
        tripSlug: trip.slug,
      });
      if (pt) {
        commission = pt.commission;
        partnerId = String(pt.partner);
        partnerTripId = String(pt._id);
      }
    }

    const settings = await getSettings();
    const breakdown = calculateCommission({
      basePrice: trip.basePrice,
      commission,
      seats: body.seats,
      config: {
        platformFeePercent: settings.platformFeePercent,
        platformFeeFlat: settings.platformFeeFlat,
      },
    });
    const visaFee = trip.visaRequired && body.travelCompliance?.visa?.hasDocument === false ? Number(trip.visaFee || 0) : 0;
    const permitFee = trip.permitRequired && body.travelCompliance?.permit?.hasDocument === false ? Number(trip.permitFee || 0) : 0;
    const complianceFee = (visaFee + permitFee) * body.seats;
    breakdown.travelerPays += complianceFee;
    breakdown.adminReceives += complianceFee;

    const bookingNumber = shortId("VOI-");
    const confirmationToken = randomBytes(24).toString("hex");
    const travelerDetails = {
      ...body.travelerDetails,
      email: body.travelerDetails.email.toLowerCase(),
      travellers: body.travelerDetails.travellers || body.seats,
    };
    const travelStartDate = body.travelStartDate ? new Date(`${body.travelStartDate}T00:00:00.000Z`) : new Date(trip.startDate);
    const configuredDays = Math.max(1, Number(trip.durationDays) || trip.itinerary?.length || Math.round((new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime()) / 86_400_000) + 1);
    const configuredDuration = (configuredDays - 1) * 86_400_000;
    const travelEndDate = new Date(travelStartDate.getTime() + configuredDuration);

    let travelerId: string;
    if (user?.role === "vendor_traveler") {
      const traveler = await (await tenantModel(User)).findByIdAndUpdate(
        user.id,
        {
          $set: {
            name: travelerDetails.name,
            mobile: travelerDetails.mobile,
          },
        },
        { returnDocument: "after" },
      );
      travelerId = String(traveler?._id ?? user.id);
    } else {
      const traveler = await (await tenantModel(User)).findOneAndUpdate(
        { email: travelerDetails.email },
        {
          $setOnInsert: {
            email: travelerDetails.email,
            role: "traveler",
          },
          $set: {
            name: travelerDetails.name,
            mobile: travelerDetails.mobile,
          },
        },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      );
      travelerId = String(traveler._id);
    }

    let inventoryReserved = false;
    if (!customDate) {
      const inventory = await (await tenantModel(Trip)).updateOne(
        { _id: trip._id, availableSeats: { $gte: body.seats } },
        { $inc: { availableSeats: -body.seats } },
      );
      if (inventory.modifiedCount !== 1) {
        const current = await (await tenantModel(Trip)).findById(trip._id).select("availableSeats").lean();
        return fail(`Only ${Number(current?.availableSeats || 0)} seat(s) left`, 409);
      }
      inventoryReserved = true;
    }

    let booking;
    try {
      booking = await (await tenantModel(Booking)).create({
        bookingNumber,
        trip: trip._id,
        traveler: travelerId,
        partner: partnerId,
        partnerTrip: partnerTripId,
        travelerDetails,
        travelCompliance: body.travelCompliance,
        visaFee,
        permitFee,
        complianceFee,
        seats: body.seats,
        travelStartDate,
        travelEndDate,
        basePrice: breakdown.basePrice,
        commission: breakdown.commission,
        platformFee: breakdown.platformFee,
        sellingPrice: breakdown.sellingPrice,
        totalAmount: breakdown.travelerPays,
        partnerEarnings: breakdown.partnerEarns,
        adminEarnings: breakdown.adminReceives,
        status: "pending",
        paymentStatus: "created",
        inventoryReserved,
      });
    } catch (error) {
      if (inventoryReserved) {
        await (await tenantModel(Trip)).updateOne(
          { _id: trip._id },
          { $inc: { availableSeats: body.seats } },
        );
      }
      throw error;
    }

    await notifyAdminsAndEmployees({
      type: "booking",
      title: "New booking received",
      message: `${bookingNumber} · ${trip.title} · ${travelerDetails.name} · ${body.seats} traveler(s)`,
      meta: { bookingId: String(booking._id), bookingNumber, href: "/admin/lms/bookings" },
    }, "lms");

    // Offline bookings are stored immediately and remain unpaid until an admin
    // records an advance or full payment.
    if (body.bookingMode === "offline") {
      const payment = await (await tenantModel(Payment)).create({ booking: booking._id, amount: breakdown.travelerPays, status: "created", notes: { offline: true, confirmationToken } });
      booking.payment = payment._id;
      await booking.save();
      return ok({ bookingId: String(booking._id), bookingNumber, amount: breakdown.travelerPays, confirmationToken, offline: true });
    }

    // Online booking: create the Razorpay order (or use demo mode locally).
    if (gateway.configured) {
      try {
        const order = await createOrder(breakdown.travelerPays, bookingNumber);
        if (order?.id) {
          const payment = await (await tenantModel(Payment)).create({
            booking: booking._id,
            razorpayOrderId: order.id,
            amount: breakdown.travelerPays,
            status: "created",
            notes: { confirmationToken },
          });
          booking.payment = payment._id;
          await booking.save();

          return ok({
            bookingId: String(booking._id),
            bookingNumber,
            amount: breakdown.travelerPays,
            razorpayOrderId: order.id,
            keyId: gateway.keyId,
            confirmationToken,
            mock: false,
          });
        }
      } catch (gatewayError) {
        console.error("[booking] Payment order creation failed", gatewayError);
        return fail("Payment provider is unavailable. Please contact the agency with your booking reference: " + bookingNumber, 502);
      }
    }

    return fail("Unable to create payment order", 502);
  } catch (err) {
    return handleError(err);
  }
}

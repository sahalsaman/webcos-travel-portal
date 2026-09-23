import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { ok, fail, handleError, currentUser } from "@/lib/api";
import { verifySignature, paymentConfig } from "@/lib/razorpay";
import "@/models";
import Booking from "@/models/Booking";
import Payment from "@/models/Payment";
import Trip from "@/models/Trip";
import Partner from "@/models/Partner";
import PartnerTrip from "@/models/PartnerTrip";
import Commission from "@/models/Commission";
import Notification from "@/models/Notification";
import { notifyAdminsAndEmployees } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const user = await currentUser();
    const body = await request.json();
    const { bookingId } = body as { bookingId?: string };
    if (!bookingId) return fail("Missing booking reference", 400);

    await connectDB();
    const booking = await (await tenantModel(Booking)).findById(bookingId);
    if (!booking) return fail("Booking not found", 404);

    const payment = await (await tenantModel(Payment)).findById(booking.payment);
    const savedToken = typeof payment?.notes?.confirmationToken === "string"
      ? payment.notes.confirmationToken
      : undefined;
    const requestToken = typeof body.confirmationToken === "string" ? body.confirmationToken : undefined;

    const tokenMatches = Boolean(savedToken && savedToken === requestToken);
    const userOwnsBooking = Boolean(user && booking.traveler && String(booking.traveler) === user.id);
    if (!tokenMatches && !userOwnsBooking) {
      return fail(user ? "Forbidden" : "Invalid booking confirmation", 403);
    }

    // Idempotent: already confirmed → return success.
    if (booking.paymentStatus === "paid") {
      return ok({ bookingNumber: booking.bookingNumber, alreadyConfirmed: true });
    }

    // Verify the gateway signature unless we're in demo (mock) mode.
    const config = await paymentConfig();
    if (!config.configured) return fail("Online payments are not configured", 503);
    const isMock = false;
    if (!isMock) {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
      const valid =
        razorpay_order_id === payment?.razorpayOrderId &&
        razorpay_payment_id &&
        razorpay_signature &&
        await verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
      if (!valid) {
        if (payment) {
          payment.status = "failed";
          await payment.save();
        }
        booking.paymentStatus = "failed";
        await booking.save();
        return fail("Payment verification failed", 400);
      }
      if (payment) {
        payment.razorpayPaymentId = razorpay_payment_id;
        payment.razorpaySignature = razorpay_signature;
      }
    }

    const claimed = await (await tenantModel(Booking)).findOneAndUpdate(
      { _id: booking._id, paymentStatus: { $nin: ["paid", "processing"] } },
      { $set: { paymentStatus: "processing" } },
      { returnDocument: "after" },
    );
    if (!claimed) {
      const current = await (await tenantModel(Booking)).findById(booking._id).select("paymentStatus bookingNumber");
      if (current?.paymentStatus === "paid") return ok({ bookingNumber: current.bookingNumber, alreadyConfirmed: true });
      return fail("Payment confirmation is already being processed", 409);
    }

    const trip = await (await tenantModel(Trip)).findById(booking.trip).select("title");

    if (payment) {
      payment.status = "paid";
      await payment.save();
    }

    booking.paymentStatus = "paid";
    booking.status = "confirmed";
    await booking.save();

    // Partner commission ledger + earnings.
    if (booking.partner && booking.partnerEarnings > 0) {
      const ledger = await (await tenantModel(Commission)).updateOne(
        { booking: booking._id },
        {
          $setOnInsert: {
            booking: booking._id,
            partner: booking.partner,
            trip: booking.trip,
            amount: booking.partnerEarnings,
            platformFee: booking.platformFee,
            status: "pending",
          },
        },
        { upsert: true },
      );
      if (ledger.upsertedCount === 1) {
        await (await tenantModel(Partner)).updateOne(
          { _id: booking.partner },
          {
            $inc: {
              totalEarnings: booking.partnerEarnings,
              pendingEarnings: booking.partnerEarnings,
            },
          },
        );
        if (booking.partnerTrip) {
          await (await tenantModel(PartnerTrip)).updateOne(
            { _id: booking.partnerTrip },
            { $inc: { bookings: 1 } },
          );
        }
      }
    }

    // Notifications (in-app) only apply to logged-in traveler bookings.
    if (booking.traveler) {
      await (await tenantModel(Notification)).create({
        user: booking.traveler,
        type: "booking",
        title: "Booking confirmed",
        message: `Your booking ${booking.bookingNumber} for "${trip?.title ?? "your package"}" is confirmed.`,
      });
    }

    await notifyAdminsAndEmployees({
      type: "payment",
      title: "Payment received",
      message: `${booking.bookingNumber} was paid successfully for ${trip?.title ?? "a package"}.`,
      meta: { bookingId: String(booking._id), bookingNumber: booking.bookingNumber, href: "/admin/finance/earnings" },
    }, "finance");

    return ok({ bookingNumber: booking.bookingNumber });
  } catch (err) {
    return handleError(err);
  }
}

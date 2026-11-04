import { connectDB } from "@/lib/db";
import { fail, handleError, ok } from "@/lib/api";
import { tenantModel } from "@/lib/tenant-db";
import { verifySignature } from "@/lib/razorpay";
import HotelReservation from "@/models/HotelReservation";
import Payment from "@/models/Payment";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await connectDB();
    const Reservation = await tenantModel(HotelReservation);
    const reservation = await Reservation.findOne({ trackingNumber: body.trackingNumber });
    if (!reservation) return fail("Hotel reservation not found", 404);
    if (reservation.confirmationToken !== body.confirmationToken) return fail("Invalid confirmation token", 403);
    if (reservation.paymentStatus === "paid") return ok({ trackingNumber: reservation.trackingNumber, alreadyConfirmed: true });
    const PaymentModel = await tenantModel(Payment);
    const payment = await PaymentModel.findOne({ hotelReservation: reservation._id });
    if (!payment || body.razorpay_order_id !== payment.razorpayOrderId) return fail("Payment details not found", 400);
    const valid = body.razorpay_payment_id && body.razorpay_signature && await verifySignature(body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature);
    if (!valid) { payment.status = "failed"; await payment.save(); reservation.paymentStatus = "failed"; await reservation.save(); return fail("Payment verification failed", 400); }
    payment.razorpayPaymentId = body.razorpay_payment_id;
    payment.razorpaySignature = body.razorpay_signature;
    payment.status = "paid";
    await payment.save();
    reservation.paymentStatus = "paid";
    reservation.status = "confirmed";
    await reservation.save();
    return ok({ trackingNumber: reservation.trackingNumber, amount: reservation.amount, status: reservation.status });
  } catch (error) { return handleError(error); }
}

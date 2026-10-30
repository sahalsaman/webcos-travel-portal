import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getBusiness, getBusinessCredentials } from "@/lib/business";
import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import Booking from "@/models/Booking";
import Payment from "@/models/Payment";
import { notifyAdminsAndEmployees } from "@/lib/notifications";

function signatureMatches(payload: string, signature: string | null, secret: string) {
  if (!signature || !secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  try { return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature)); } catch { return false; }
}

export async function POST(request: Request) {
  const payload = await request.text();
  try {
    const business = await getBusiness();
    const credential = (await getBusinessCredentials(business)).find((item) => item.platform === "RAZORPAY_API");
    if (!signatureMatches(payload, request.headers.get("x-razorpay-signature"), credential?.webhookSecret?.trim() || "")) {
      return NextResponse.json({ success: false, message: "Invalid Razorpay webhook signature" }, { status: 400 });
    }
    const event = JSON.parse(payload) as { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } } } };
    const paymentEntity = event.payload?.payment?.entity;
    if (!paymentEntity?.order_id) return NextResponse.json({ success: true, ignored: true });
    await connectDB();
    const PaymentModel = await tenantModel(Payment);
    const BookingModel = await tenantModel(Booking);
    const payment = await PaymentModel.findOne({ razorpayOrderId: paymentEntity.order_id });
    if (!payment) return NextResponse.json({ success: true, ignored: true });
    if (event.event === "payment.captured") {
      payment.status = "paid";
      payment.razorpayPaymentId = paymentEntity.id;
      await payment.save();
      const previousBooking = await BookingModel.findById(payment.booking).select("status bookingNumber").lean();
      const confirmed = await BookingModel.findOneAndUpdate({ _id: payment.booking, paymentStatus: { $ne: "paid" } }, { $set: { paymentStatus: "paid", status: "confirmed" } }, { new: true });
      if (confirmed) {
        await notifyAdminsAndEmployees({ type: "payment", title: "Payment received", message: `${confirmed.bookingNumber} was paid successfully.`, meta: { bookingId: String(confirmed._id), bookingNumber: confirmed.bookingNumber, href: "/finance/earnings" } }, "finance");
        if (previousBooking?.status !== confirmed.status) {
          await notifyAdminsAndEmployees({ type: "booking", title: "Booking status changed", message: `${confirmed.bookingNumber} changed from ${previousBooking?.status ?? "unknown"} to ${confirmed.status} after payment.`, meta: { bookingId: String(confirmed._id), bookingNumber: confirmed.bookingNumber, status: confirmed.status, href: "/lms/bookings" } }, "lms");
        }
      }
    } else if (event.event === "payment.failed") {
      payment.status = "failed";
      payment.razorpayPaymentId = paymentEntity.id;
      await payment.save();
      await BookingModel.updateOne({ _id: payment.booking, paymentStatus: { $ne: "paid" } }, { $set: { paymentStatus: "failed" } });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[razorpay-webhook]", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

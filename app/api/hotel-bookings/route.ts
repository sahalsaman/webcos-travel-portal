import { z } from "zod";
import { randomBytes } from "node:crypto";
import { connectDB } from "@/lib/db";
import { currentUser, fail, handleError, ok } from "@/lib/api";
import { tenantModel } from "@/lib/tenant-db";
import { prepareHotelReservation } from "@/lib/hotel-reservation";
import { shortId } from "@/lib/utils";
import { getBusiness } from "@/lib/business";
import { notifyAdminsAndEmployees } from "@/lib/notifications";
import { sendHotelBookingWhatsApp } from "@/lib/wabis";
import Hotel from "@/models/Hotel";
import HotelReservation from "@/models/HotelReservation";
import User from "@/models/User";
import Payment from "@/models/Payment";
import { createOrder, paymentConfig } from "@/lib/razorpay";

const requestSchema = z.object({
  hotelId: z.string().min(1),
  roomId: z.string().min(1),
  checkIn: z.string().date(),
  checkOut: z.string().date(),
  rooms: z.number().int().min(1).max(10),
  guests: z.number().int().min(1).max(40),
  travelerDetails: z.object({
    name: z.string().trim().min(2),
    email: z.string().trim().email().transform((value) => value.toLowerCase()),
    phone: z.string().trim().regex(/^\+?[1-9]\d{6,14}$/, "Enter a valid phone number with country code"),
    notes: z.string().trim().max(1000).optional().default(""),
  }),
  paymentMode: z.enum(["online", "offline"]).default("offline"),
}).refine((value) => value.checkOut > value.checkIn, { path: ["checkOut"], message: "Check-out must be after check-in" });

/** Public direct-hotel reservation request for a tenant storefront. */
export async function POST(request: Request) {
  try {
    const data = requestSchema.parse(await request.json());
    if (data.paymentMode === "online" && !(await paymentConfig()).configured) return fail("Online payments are not configured. Please choose offline booking.", 503);
    await connectDB();
    const business = await getBusiness();
    const HotelModel = await tenantModel(Hotel);
    const hotel = await HotelModel.findOne({ _id: data.hotelId, directHotelBooking: true })
      .populate("supplier", "city country")
      .lean();
    if (!hotel) return fail("This hotel is not available for direct booking", 404);

    const today = new Date().toISOString().slice(0, 10);
    if (data.checkIn < today) return fail("Choose a future check-in date", 422);

    const reservation = await prepareHotelReservation({ ...data, status: "requested" });
    const user = await currentUser();
    const UserModel = await tenantModel(User);
    const traveler = user?.role === "tenant_traveler"
      ? await UserModel.findByIdAndUpdate(user.id, { $set: { name: data.travelerDetails.name, phone: data.travelerDetails.phone } }, { new: true })
      : await UserModel.findOneAndUpdate(
        { email: data.travelerDetails.email },
        {
          $setOnInsert: { email: data.travelerDetails.email, role: "tenant_traveler", businessId: business._id },
          $set: { name: data.travelerDetails.name, phone: data.travelerDetails.phone },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );

    const supplier = hotel.supplier as unknown as { city?: string; country?: string } | null;
    const destination = [supplier?.city, supplier?.country].filter(Boolean).join(", ") || hotel.name;
    const trackingNumber = shortId("HTL-");
    const confirmationToken = randomBytes(24).toString("hex");
    const record = await (await tenantModel(HotelReservation)).create({
      businessId: business._id,
      customer: traveler?._id ?? null,
      customerName: data.travelerDetails.name,
      phone: data.travelerDetails.phone,
      destination,
      checkIn: new Date(`${data.checkIn}T00:00:00.000Z`),
      checkOut: new Date(`${data.checkOut}T00:00:00.000Z`),
      rooms: data.rooms,
      guests: data.guests,
      mealPlan: "",
      status: "requested",
      notes: data.travelerDetails.notes,
      trackingNumber,
      ...reservation,
      paymentStatus: "created",
      confirmationToken,
    });
    let order: { id: string } | null = null;
    if (data.paymentMode === "online") {
      order = await createOrder(reservation.amount, trackingNumber);
      const payment = await (await tenantModel(Payment)).create({ businessId: business._id, hotelReservation: record._id, amount: reservation.amount, currency: "INR", status: "created", razorpayOrderId: order.id, notes: { confirmationToken } });
      record.payment = payment._id;
      await record.save();
    }
    await notifyAdminsAndEmployees({
      type: "booking",
      title: "New direct hotel booking",
      message: `${trackingNumber} · ${reservation.hotelName} · ${data.travelerDetails.name}`,
      meta: { href: "/lms/hotels", hotelReservationId: String(record._id), trackingNumber },
    }, "lms");
    await sendHotelBookingWhatsApp({
      phone: data.travelerDetails.phone,
      travelerName: data.travelerDetails.name,
      hotelName: reservation.hotelName,
      location: destination,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      roomDetails: `${reservation.roomType} · ${data.rooms} room${data.rooms === 1 ? "" : "s"}`,
      bookingNumber: trackingNumber,
      hotelId: data.hotelId,
    });
    return ok({ trackingNumber, amount: reservation.amount, status: record.status, paymentMode: data.paymentMode, confirmationToken, orderId: order?.id ?? null, keyId: data.paymentMode === "online" ? (await paymentConfig()).keyId : null }, 201);
  } catch (error) {
    return handleError(error);
  }
}

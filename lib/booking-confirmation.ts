import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { currentUser } from "@/lib/api";
import { serialize } from "@/lib/utils";
import "@/models";
import Booking from "@/models/Booking";
import type { ItineraryItem } from "@/types";

export interface BookingConfirmation {
  _id: string;
  bookingNumber: string;
  travelerDetails: {
    name: string;
    email: string;
    mobile: string;
    travellers: number;
    departureCity?: string;
    adults?: number;
    childrenWithBed?: number;
    childrenWithoutBed?: number;
    infants?: number;
    notes?: string;
  };
  seats: number;
  travelStartDate: string;
  travelEndDate: string;
  sellingPrice: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  trip: {
    title: string;
    slug: string;
    destination: string;
    country: string;
    pickupLocation?: string;
    images: string[];
    itinerary: ItineraryItem[];
  };
  payment?: {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    method?: string;
    currency?: string;
    notes?: { confirmationToken?: string };
  };
}

export async function getAuthorizedBookingConfirmation(reference: string, token?: string) {
  if (!reference) return null;
  await connectDB();
  const booking = await (await tenantModel(Booking)).findOne({ bookingNumber: reference })
    .populate("trip", "title slug destination country pickupLocation images itinerary")
    .populate("payment", "razorpayOrderId razorpayPaymentId method currency notes")
    .lean();
  if (!booking) return null;

  const user = await currentUser();
  const ownsBooking = Boolean(user && booking.traveler && String(booking.traveler) === user.id);
  const isAdmin = user?.role === "admin";
  const payment = booking.payment as unknown as { notes?: { confirmationToken?: string } } | undefined;
  const validToken = Boolean(token && payment?.notes?.confirmationToken && token === payment.notes.confirmationToken);
  if (!ownsBooking && !isAdmin && !validToken) return null;

  const data = serialize(booking) as unknown as BookingConfirmation;
  if (data.payment?.notes) delete data.payment.notes;
  return data;
}

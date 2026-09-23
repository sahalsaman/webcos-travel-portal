import { Schema, model, models, type InferSchemaType } from "mongoose";
import { HOTEL_RESERVATION_STATUSES } from "@/lib/constants";

const HotelReservationSchema = new Schema({
  lead: { type: Schema.Types.ObjectId, ref: "Lead", default: null, index: true },
  customer: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
  trackingNumber: { type: String, required: true, unique: true, index: true }, customerName: { type: String, required: true, trim: true, index: true }, phone: { type: String, required: true, trim: true }, hotelName: { type: String, required: true, trim: true, index: true }, destination: { type: String, required: true, trim: true }, confirmationNumber: { type: String, default: "", trim: true, index: true }, checkIn: { type: Date, required: true, index: true }, checkOut: { type: Date, required: true, index: true }, rooms: { type: Number, default: 1, min: 1 }, guests: { type: Number, default: 1, min: 1 }, roomType: { type: String, default: "", trim: true }, mealPlan: { type: String, default: "", trim: true }, amount: { type: Number, default: 0, min: 0 }, status: { type: String, enum: HOTEL_RESERVATION_STATUSES, default: "requested", index: true }, assignedTo: { type: String, default: "", trim: true }, notes: { type: String, default: "", trim: true },
}, { timestamps: true });
export type HotelReservationDoc = InferSchemaType<typeof HotelReservationSchema> & { _id: string };
export default models.HotelReservation || model("HotelReservation", HotelReservationSchema);

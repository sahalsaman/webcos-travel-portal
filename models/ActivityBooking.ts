import { Schema, model, models, type InferSchemaType } from "mongoose";
import { ACTIVITY_BOOKING_STATUSES, PAYMENT_STATUSES } from "@/lib/constants";

const ActivityBookingSchema = new Schema({
  bookingNumber: { type: String, required: true, unique: true, index: true },
  activity: { type: Schema.Types.ObjectId, ref: "Activity", required: true, index: true },
  traveler: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  mobile: { type: String, required: true },
  activityDate: { type: Date, required: true, index: true },
  timeSlot: { type: String, default: "" },
  adults: { type: Number, default: 1, min: 0 },
  children: { type: Number, default: 0, min: 0 },
  totalParticipants: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ACTIVITY_BOOKING_STATUSES, default: "pending", index: true },
  paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: "created", index: true },
  notes: { type: String, default: "" },
}, { timestamps: true });

export type ActivityBookingDoc = InferSchemaType<typeof ActivityBookingSchema> & { _id: string };
export default models.ActivityBooking || model("ActivityBooking", ActivityBookingSchema);

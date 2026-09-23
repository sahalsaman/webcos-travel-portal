import { Schema, model, models, type InferSchemaType } from "mongoose";
import { TICKET_STATUSES, TICKET_TYPES } from "@/lib/constants";

const TicketTrackingSchema = new Schema({
  lead: { type: Schema.Types.ObjectId, ref: "Lead", default: null, index: true },
  customer: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
  trackingNumber: { type: String, required: true, unique: true, index: true }, customerName: { type: String, required: true, trim: true, index: true }, phone: { type: String, required: true, trim: true }, ticketType: { type: String, enum: TICKET_TYPES, required: true, index: true }, provider: { type: String, required: true, trim: true }, referenceNumber: { type: String, default: "", trim: true, index: true }, origin: { type: String, required: true, trim: true }, destination: { type: String, required: true, trim: true }, departureAt: { type: Date, required: true, index: true }, arrivalAt: { type: Date, default: null }, travelers: { type: Number, default: 1, min: 1 }, amount: { type: Number, default: 0, min: 0 }, status: { type: String, enum: TICKET_STATUSES, default: "requested", index: true }, assignedTo: { type: String, default: "", trim: true }, notes: { type: String, default: "", trim: true },
}, { timestamps: true });
export type TicketTrackingDoc = InferSchemaType<typeof TicketTrackingSchema> & { _id: string };
export default models.TicketTracking || model("TicketTracking", TicketTrackingSchema);

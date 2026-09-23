import { Schema, model, models, type InferSchemaType } from "mongoose";
import { LEAD_SOURCES, LEAD_STATUSES } from "@/lib/constants";

const LeadSchema = new Schema(
  {
    leadNumber: { type: String, required: true, unique: true, index: true },
    customerName: { type: String, required: true, trim: true, index: true },
    email: { type: String, default: "", lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    destination: { type: String, default: "", trim: true },
    travelDate: { type: Date, default: null },
    travelers: { type: Number, default: 1, min: 1 },
    budget: { type: Number, default: 0, min: 0 },
    source: { type: String, enum: LEAD_SOURCES, required: true, index: true },
    status: { type: String, enum: LEAD_STATUSES, default: "new", index: true },
    campaign: { type: Schema.Types.ObjectId, ref: "Campaign", default: null, index: true },
    quotation: { type: Schema.Types.ObjectId, ref: "Quotation", default: null, index: true },
    assignedTo: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

export type LeadDoc = InferSchemaType<typeof LeadSchema> & { _id: string };
export default models.Lead || model("Lead", LeadSchema);

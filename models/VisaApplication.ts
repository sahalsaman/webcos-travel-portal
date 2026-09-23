import { Schema, model, models, type InferSchemaType } from "mongoose";
import { VISA_STATUSES } from "@/lib/constants";

const VisaApplicationSchema = new Schema(
  {
    lead: { type: Schema.Types.ObjectId, ref: "Lead", default: null, index: true },
    customer: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    visaNumber: { type: String, required: true, unique: true, index: true },
    applicantName: { type: String, required: true, trim: true, index: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: "", lowercase: true, trim: true },
    passportNumber: { type: String, required: true, trim: true, uppercase: true, index: true },
    destinationCountry: { type: String, required: true, trim: true, index: true },
    visaType: { type: String, required: true, trim: true },
    status: { type: String, enum: VISA_STATUSES, default: "documents_pending", index: true },
    submittedAt: { type: Date, default: null },
    expectedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    bookingNumber: { type: String, default: "", trim: true },
    assignedTo: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

export type VisaApplicationDoc = InferSchemaType<typeof VisaApplicationSchema> & { _id: string };
export default models.VisaApplication || model("VisaApplication", VisaApplicationSchema);

import { Schema, model, models, type InferSchemaType } from "mongoose";
import { QUOTATION_STATUSES } from "@/lib/constants";

const QuotationItemSchema = new Schema(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0.01 },
    unitPrice: { type: Number, required: true, min: 0 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const QuotationSchema = new Schema(
  {
    quotationNumber: { type: String, required: true, unique: true, index: true },
    lead: { type: Schema.Types.ObjectId, ref: "Lead", default: null, index: true },
    customer: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    trip: { type: Schema.Types.ObjectId, ref: "Trip", default: null, index: true },
    customItinerary: { type: [{ day: Number, title: String, description: String }], default: [] },
    shareToken: { type: String, required: true, unique: true, index: true },
    customerName: { type: String, required: true, trim: true, index: true },
    customerEmail: { type: String, default: "", lowercase: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    items: { type: [QuotationItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, default: 0, min: 0, max: 100 },
    taxAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    validUntil: { type: Date, required: true, index: true },
    status: { type: String, enum: QUOTATION_STATUSES, default: "draft", index: true },
    notes: { type: String, default: "", trim: true },
    terms: { type: String, default: "", trim: true },
    policy: { type: String, default: "", trim: true },
    importantInformation: { type: String, default: "", trim: true },
    otherInformation: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

export type QuotationDoc = InferSchemaType<typeof QuotationSchema> & { _id: string };

export default models.Quotation || model("Quotation", QuotationSchema);

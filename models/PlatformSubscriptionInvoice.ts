import { Schema, model, models } from "mongoose";

const PlatformSubscriptionInvoiceSchema = new Schema({
  business: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
  month: { type: String, required: true, index: true },
  plan: { type: String, required: true },
  monthlyAmount: { type: Number, required: true, min: 0 },
  setupFee: { type: Number, default: 0, min: 0 },
  carryForward: { type: Number, default: 0, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["pending", "paid", "overdue", "cancelled"], default: "pending", index: true },
  generatedAt: { type: Date, default: Date.now },
  paidAt: { type: Date, default: null },
}, { timestamps: true });
PlatformSubscriptionInvoiceSchema.index({ business: 1, month: 1 }, { unique: true });

export default models.PlatformSubscriptionInvoice || model("PlatformSubscriptionInvoice", PlatformSubscriptionInvoiceSchema);

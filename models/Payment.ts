import { Schema, model, models, type InferSchemaType } from "mongoose";
import { PAYMENT_STATUSES } from "@/lib/constants";

const PaymentSchema = new Schema(
  {
    booking: { type: Schema.Types.ObjectId, ref: "Booking", required: true, index: true },
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String, index: true },
    razorpaySignature: String,
    amount: { type: Number, required: true }, // in INR (rupees)
    currency: { type: String, default: "INR" },
    status: { type: String, enum: PAYMENT_STATUSES, default: "created", index: true },
    method: String,
    refundId: String,
    refundAmount: { type: Number, default: 0 },
    notes: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

export type PaymentDoc = InferSchemaType<typeof PaymentSchema> & { _id: string };

export default models.Payment || model("Payment", PaymentSchema);

import { Schema, model, models } from "mongoose";

const PhoneOtpSchema = new Schema(
  {
    businessId: { type: Schema.Types.ObjectId, required: true, index: true },
    mobile: { type: String, required: true, index: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    consumedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true },
);

PhoneOtpSchema.index({ businessId: 1, mobile: 1, createdAt: -1 });

export default models.PhoneOtp || model("PhoneOtp", PhoneOtpSchema);

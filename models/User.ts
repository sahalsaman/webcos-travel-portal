import { Schema, model, models, type InferSchemaType } from "mongoose";
import { ROLES } from "@/lib/constants";

const UserSchema = new Schema(
  {
  businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // Hidden by default; explicitly .select('+password') when authenticating.
    password: { type: String, select: false },
    countryCode: { type: String, trim: true },
    phone: { type: String, trim: true },
    role: { type: String, enum: ROLES, default: "tenant_traveler", index: true },
    otp: {
      codeHash: { type: String, default: "" },
      attempts: { type: Number, default: 0 },
      consumedAt: { type: Date, default: null },
      expiresAt: { type: Date, default: null },
    },
    image: String,
    emailVerified: Date,
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: string };

export default models.User || model("User", UserSchema);

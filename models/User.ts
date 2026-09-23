import { Schema, model, models, type InferSchemaType } from "mongoose";
import { ROLES } from "@/lib/constants";

const UserSchema = new Schema(
  {
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
    mobile: { type: String, trim: true },
    role: { type: String, enum: ROLES, default: "traveler", index: true },
    image: String,
    emailVerified: Date,
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: string };

export default models.User || model("User", UserSchema);

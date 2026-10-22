import { CREDENTIOL_PLATFORM } from "@/lib/constants";
import { Schema, model, models, type InferSchemaType } from "mongoose";

const BusinessSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    mobile: { type: String, trim: true },
    adrress: { type: String, trim: true },
    businessId: { type: Schema.Types.ObjectId, ref: "Business", required: true },
    credentials: [{
      platform: { type: String, enum: CREDENTIOL_PLATFORM, index: true },
      name: { type: String, trim: true },
      apikey: { type: String, trim: true },
      secretKey: { type: String, trim: true },
      url: { type: String, trim: true },
    }],
    logo: String,
    emailVerified: Date,
  },
  { timestamps: true },
);

export type BusinessDoc = InferSchemaType<typeof BusinessSchema> & { _id: string };

export default models.Business || model("Business", BusinessSchema);

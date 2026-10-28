import { Schema, model, models, type InferSchemaType } from "mongoose";
import { CREDENTIOL_PLATFORM } from "@/lib/constants";

/** Platform registry for tenant businesses. This is intentionally not a
 * tenant-owned record, so it is the root of businessId ownership. */
const BusinessSchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  databaseName: { type: String, required: true, unique: true },
  hosts: { type: [String], required: true, unique: true },
  siteUrl: { type: String, required: true },
  address: { type: String, default: "" },
  ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  businessEmail: { type: String, default: "", trim: true, lowercase: true },
  businessPhoneCountryCode: { type: String, default: "", trim: true },
  businessPhone: { type: String, default: "", trim: true },
  BusinessWhatsappCountryCode : { type: String, default: "", trim: true },
  businessWhatsapp : { type: String, default: "", trim: true },
  logoUrl: { type: String, default: "" },
  primaryColor: { type: String, default: "#0060e6" },
  credentials: [{
    platform: { type: String, enum: CREDENTIOL_PLATFORM, required: true },
    name: { type: String, trim: true, default: "" },
    apikey: { type: String, trim: true, default: "" },
    secretKey: { type: String, trim: true, default: "" },
    url: { type: String, trim: true, default: "" },
    webhookSecret: { type: String, trim: true, default: "" },
    alertEmail: { type: String, trim: true, lowercase: true, default: "" },
  }],
  provisioned: { type: Boolean, default: false },
  status: { type: String, enum: ["active", "suspended"], default: "active" },
  subscription: {
    plan: { type: String, default: "Starter" },
    status: { type: String, enum: ["trial", "active", "past_due", "cancelled"], default: "trial" },
    amount: { type: Number, default: 0, min: 0 },
    setupFee: { type: Number, default: 0, min: 0 },
    setupPaidAmount: { type: Number, default: 0, min: 0 },
    setupPaidAt: { type: Date, default: null },
    currency: { type: String, default: "INR" },
    renewsAt: { type: Date, default: null },
  },
}, { timestamps: true });

export type BusinessDoc = InferSchemaType<typeof BusinessSchema> & { _id: string };
export default models.Business || model("Business", BusinessSchema);

import { Schema, model, models, type InferSchemaType } from "mongoose";
import {
  PARTNER_TYPES,
  PARTNER_STATUSES,
  DEFAULT_SETTINGS,
} from "@/lib/constants";

const SocialLinkSchema = new Schema(
  { label: String, url: String },
  { _id: false },
);

const PartnerSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    businessName: { type: String, required: true, trim: true },
    // White-label namespace, e.g. voibee.com/p/<slug>/<trip>
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    partnerType: {
      type: String,
      enum: PARTNER_TYPES,
      default: "Travel Agency",
    },
    logo: String,
    bannerImage: String,
    profileImage: String,
    bio: String,
    socialLinks: { type: [SocialLinkSchema], default: [] },
    contactEmail: String,
    contactPhone: String,
    status: {
      type: String,
      enum: PARTNER_STATUSES,
      default: "pending",
      index: true,
    },
    defaultCommission: {
      type: Number,
      default: DEFAULT_SETTINGS.defaultCommission,
    },
    totalEarnings: { type: Number, default: 0 },
    pendingEarnings: { type: Number, default: 0 },
    paidEarnings: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export type PartnerDoc = InferSchemaType<typeof PartnerSchema> & {
  _id: string;
};

export default models.Partner || model("Partner", PartnerSchema);

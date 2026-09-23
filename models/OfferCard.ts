import { Schema, model, models, type InferSchemaType } from "mongoose";
import { OFFER_CARD_STATUSES } from "@/lib/constants";

const OfferCardSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    images: { type: [String], default: [] },
    href: { type: String, default: "/packages" },
    ctaLabel: { type: String, default: "View packages" },
    priceLabel: { type: String, default: "" },
    status: { type: String, enum: OFFER_CARD_STATUSES, default: "active", index: true },
    featured: { type: Boolean, default: false, index: true },
    sortOrder: { type: Number, default: 0, index: true },
    tags: { type: [String], default: [] },
    country: { type: String, default: "India" },
    countryCode: { type: String, default: "IN", index: true },
  },
  { timestamps: true },
);

OfferCardSchema.index({ title: "text", description: "text", tags: "text" });

export type OfferCardDoc = InferSchemaType<typeof OfferCardSchema> & { _id: string };

export default models.OfferCard || model("OfferCard", OfferCardSchema);

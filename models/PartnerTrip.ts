import { Schema, model, models, type InferSchemaType } from "mongoose";

/**
 * A white-label listing: a partner's resale of an admin package with their own
 * commission. Resolves the public URL /p/<partnerSlug>/<tripSlug>.
 */
const PartnerTripSchema = new Schema(
  {
    partner: {
      type: Schema.Types.ObjectId,
      ref: "Partner",
      required: true,
      index: true,
    },
    trip: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
      index: true,
    },
    // Denormalised for fast URL lookups.
    partnerSlug: { type: String, required: true, lowercase: true, index: true },
    tripSlug: { type: String, required: true, lowercase: true, index: true },
    commission: { type: Number, required: true, min: 0, default: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true, index: true },
    clicks: { type: Number, default: 0 },
    bookings: { type: Number, default: 0 },
  },
  { timestamps: true },
);

PartnerTripSchema.index({ partner: 1, trip: 1 }, { unique: true });
PartnerTripSchema.index({ partnerSlug: 1, tripSlug: 1 }, { unique: true });

export type PartnerTripDoc = InferSchemaType<typeof PartnerTripSchema> & {
  _id: string;
};

export default models.PartnerTrip || model("PartnerTrip", PartnerTripSchema);

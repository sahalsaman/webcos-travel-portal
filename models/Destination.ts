import { Schema, model, models, type InferSchemaType } from "mongoose";
import { DESTINATION_STATUSES } from "@/lib/constants";


const DestinationSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    images: { type: [String], default: [] },
    basePrice: { type: Number, default: 0},
    status: { type: String, enum: DESTINATION_STATUSES, default: "active", index: true },
    featured: { type: Boolean, default: false, index: true },
    tags: { type: [String], default: [] },
    popular: { type: Boolean, default: false, index: true },
    country: { type: String, default: "India" },
    countryCode: { type: String, default: "IN" },
  },
  { timestamps: true },
);

// Full-text search across the fields used by the search bar.
DestinationSchema.index({ title: "text", description: "text", tags: "text" });
DestinationSchema.index({ status: 1, popular: -1, featured: -1, title: 1 });
DestinationSchema.index({ status: 1, countryCode: 1, popular: -1 });

export type DestinationDoc = InferSchemaType<typeof DestinationSchema> & { _id: string };

export default models.Destination || model("Destination", DestinationSchema);

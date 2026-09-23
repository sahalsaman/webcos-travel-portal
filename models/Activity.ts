import { Schema, model, models, type InferSchemaType } from "mongoose";
import { ACTIVITY_STATUSES } from "@/lib/constants";

const ActivitySchema = new Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
  type: { type: Schema.Types.ObjectId, ref: "ActivityType", required: true, index: true },
  destination: { type: String, required: true, trim: true, index: true },
  country: { type: String, default: "India" },
  shortDescription: { type: String, default: "" },
  description: { type: String, default: "" },
  images: { type: [String], default: [] },
  basePrice: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, default: 0, min: 0 },
  duration: { type: String, default: "" },
  highlights: { type: [String], default: [] },
  inclusions: { type: [String], default: [] },
  exclusions: { type: [String], default: [] },
  importantInfo: { type: [String], default: [] },
  meetingPoint: { type: String, default: "" },
  seasonal: { type: Boolean, default: false, index: true },
  bestSelling: { type: Boolean, default: false, index: true },
  featured: { type: Boolean, default: false, index: true },
  status: { type: String, enum: ACTIVITY_STATUSES, default: "draft", index: true },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

ActivitySchema.index({ title: "text", destination: "text", shortDescription: "text", description: "text" });
export type ActivityDoc = InferSchemaType<typeof ActivitySchema> & { _id: string };
export default models.Activity || model("Activity", ActivitySchema);

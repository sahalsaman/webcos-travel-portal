import { Schema, model, models, type InferSchemaType } from "mongoose";
import { ACTIVITY_TYPE_STATUSES } from "@/lib/constants";

const ActivityTypeSchema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
  description: { type: String, default: "" },
  image: { type: String, default: "" },
  status: { type: String, enum: ACTIVITY_TYPE_STATUSES, default: "active", index: true },
  featured: { type: Boolean, default: false, index: true },
  sortOrder: { type: Number, default: 0, index: true },
}, { timestamps: true });

export type ActivityTypeDoc = InferSchemaType<typeof ActivityTypeSchema> & { _id: string };
export default models.ActivityType || model("ActivityType", ActivityTypeSchema);

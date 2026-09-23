import { Schema, model, models, type InferSchemaType } from "mongoose";
import { REPUTATION_PLATFORMS, REPUTATION_SENTIMENTS, REPUTATION_STATUSES } from "@/lib/constants";

const ReputationSchema = new Schema({
  platform: { type: String, enum: REPUTATION_PLATFORMS, required: true, index: true },
  reviewerName: { type: String, required: true, trim: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 5, index: true },
  reviewText: { type: String, required: true, trim: true },
  reviewUrl: { type: String, default: "", trim: true },
  sentiment: { type: String, enum: REPUTATION_SENTIMENTS, required: true, index: true },
  status: { type: String, enum: REPUTATION_STATUSES, default: "new", index: true },
  assignedTo: { type: String, default: "", trim: true },
  responseText: { type: String, default: "", trim: true },
  reviewedAt: { type: Date, required: true, index: true },
  respondedAt: { type: Date, default: null },
  notes: { type: String, default: "", trim: true },
}, { timestamps: true });

export type ReputationDoc = InferSchemaType<typeof ReputationSchema> & { _id: string };
export default models.Reputation || model("Reputation", ReputationSchema);

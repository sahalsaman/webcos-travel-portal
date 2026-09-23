import { Schema, model, models, type InferSchemaType } from "mongoose";
import { CAMPAIGN_CHANNELS, CAMPAIGN_STATUSES } from "@/lib/constants";

const CampaignSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    channel: { type: String, enum: CAMPAIGN_CHANNELS, required: true, index: true },
    status: { type: String, enum: CAMPAIGN_STATUSES, default: "draft", index: true },
    targetAudience: { type: String, required: true, trim: true },
    budget: { type: Number, default: 0, min: 0 },
    spent: { type: Number, default: 0, min: 0 },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, default: null },
    owner: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

export type CampaignDoc = InferSchemaType<typeof CampaignSchema> & { _id: string };

export default models.Campaign || model("Campaign", CampaignSchema);

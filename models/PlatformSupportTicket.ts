import { Schema, model, models } from "mongoose";

const PlatformSupportTicketSchema = new Schema({
  business: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
  subject: { type: String, required: true, trim: true },
  message: { type: String, default: "", trim: true },
  priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
  status: { type: String, enum: ["open", "in_progress", "resolved", "closed"], default: "open", index: true },
  adminNotes: { type: String, default: "", trim: true },
}, { timestamps: true });

export default models.PlatformSupportTicket || model("PlatformSupportTicket", PlatformSupportTicketSchema);

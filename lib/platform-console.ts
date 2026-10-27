import mongoose, { Schema } from "mongoose";
import { configuredPlatformDatabase, connectDB } from "@/lib/db";

export async function platformSupportTicketModel() {
  await connectDB();
  const db = mongoose.connection.useDb(configuredPlatformDatabase(), { useCache: true });
  return db.models.PlatformSupportTicket || db.model("PlatformSupportTicket", new Schema({
    business: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, default: "", trim: true },
    priority: { type: String, enum: ["low", "medium", "high", "urgent"], default: "medium" },
    status: { type: String, enum: ["open", "in_progress", "resolved", "closed"], default: "open", index: true },
  }, { timestamps: true }));
}

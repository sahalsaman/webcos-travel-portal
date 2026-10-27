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
    adminNotes: { type: String, default: "", trim: true },
  }, { timestamps: true }));
}

export async function platformSubscriptionInvoiceModel() {
  await connectDB();
  const db = mongoose.connection.useDb(configuredPlatformDatabase(), { useCache: true });
  return db.models.PlatformSubscriptionInvoice || db.model("PlatformSubscriptionInvoice", new Schema({
    business: { type: Schema.Types.ObjectId, ref: "Business", required: true, index: true }, month: { type: String, required: true, index: true }, plan: { type: String, required: true }, monthlyAmount: { type: Number, required: true, min: 0 }, setupFee: { type: Number, default: 0, min: 0 }, carryForward: { type: Number, default: 0, min: 0 }, totalAmount: { type: Number, required: true, min: 0 }, status: { type: String, enum: ["pending", "paid", "overdue", "cancelled"], default: "pending", index: true }, generatedAt: { type: Date, default: Date.now }, paidAt: { type: Date, default: null },
  }, { timestamps: true }).index({ business: 1, month: 1 }, { unique: true }));
}

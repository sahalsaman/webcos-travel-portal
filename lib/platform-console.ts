import mongoose from "mongoose";
import { configuredPlatformDatabase, connectDB } from "@/lib/db";
import PlatformSupportTicket from "@/models/PlatformSupportTicket";
import PlatformSubscriptionInvoice from "@/models/PlatformSubscriptionInvoice";

export async function platformSupportTicketModel() {
  await connectDB();
  const db = mongoose.connection.useDb(configuredPlatformDatabase(), { useCache: true });
  return db.models.PlatformSupportTicket || db.model("PlatformSupportTicket", PlatformSupportTicket.schema);
}

export async function platformSubscriptionInvoiceModel() {
  await connectDB();
  const db = mongoose.connection.useDb(configuredPlatformDatabase(), { useCache: true });
  return db.models.PlatformSubscriptionInvoice || db.model("PlatformSubscriptionInvoice", PlatformSubscriptionInvoice.schema);
}

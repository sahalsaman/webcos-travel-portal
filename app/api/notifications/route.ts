import { tenantModel } from "@/lib/tenant-db";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { currentUser, fail, handleError, ok } from "@/lib/api";
import "@/models";
import Notification from "@/models/Notification";

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) return fail("Authentication required", 401);

    await connectDB();
    const query = { user: user.id, channel: "in-app" };
    const [items, unreadCount] = await Promise.all([
      (await tenantModel(Notification)).find(query)
        .sort({ createdAt: -1 })
        .limit(10)
        .select("type title message read meta createdAt")
        .lean(),
      (await tenantModel(Notification)).countDocuments({ ...query, read: false }),
    ]);

    return ok({ items, unreadCount });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await currentUser();
    if (!user) return fail("Authentication required", 401);

    const body = (await request.json()) as { id?: string; all?: boolean };
    await connectDB();

    if (body.all) {
      await (await tenantModel(Notification)).updateMany(
        { user: user.id, channel: "in-app", read: false },
        { $set: { read: true } },
      );
      return ok({ updated: true });
    }

    if (!body.id || !Types.ObjectId.isValid(body.id)) return fail("Invalid notification", 400);
    const notification = await (await tenantModel(Notification)).findOneAndUpdate(
      { _id: body.id, user: user.id, channel: "in-app" },
      { $set: { read: true } },
      { new: true },
    ).select("_id read");
    if (!notification) return fail("Notification not found", 404);

    return ok({ id: String(notification._id), read: notification.read });
  } catch (error) {
    return handleError(error);
  }
}

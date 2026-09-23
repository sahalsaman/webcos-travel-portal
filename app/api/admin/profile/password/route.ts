import { tenantModel } from "@/lib/tenant-db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { fail, handleError, ok, requireApiRole } from "@/lib/api";
import "@/models";
import User from "@/models/User";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export async function PATCH(request: Request) {
  try {
    const user = await requireApiRole(["admin", "employee"]);
    const data = changePasswordSchema.parse(await request.json());
    await connectDB();

    const account = await (await tenantModel(User)).findById(user.id).select("+password");
    if (!account?.password) return fail("Password login is not enabled for this account", 400);

    const valid = await bcrypt.compare(data.currentPassword, account.password);
    if (!valid) return fail("Current password is incorrect", 422);

    account.password = await bcrypt.hash(data.newPassword, 10);
    await account.save();

    return ok({ updated: true });
  } catch (err) {
    return handleError(err);
  }
}

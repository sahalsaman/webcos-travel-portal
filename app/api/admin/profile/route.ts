import { z } from "zod";
import { connectDB } from "@/lib/db";
import { fail, handleError, ok, requireApiRole } from "@/lib/api";
import { tenantModel } from "@/lib/tenant-db";
import User from "@/models/User";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Enter a valid email address").max(160).transform((value) => value.toLowerCase()),
  mobile: z.string().trim().max(30).default(""),
  image: z.union([z.literal(""), z.url("Choose a valid profile image")]).default(""),
});

export async function GET() {
  try {
    const user = await requireApiRole(["admin", "employee"]);
    await connectDB();
    const account = await (await tenantModel(User)).findById(user.id).select("name email mobile image role").lean();
    if (!account) return fail("Account not found", 404);
    return ok(account);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireApiRole(["admin", "employee"]);
    const data = profileSchema.parse(await request.json());
    await connectDB();
    const account = await (await tenantModel(User)).findByIdAndUpdate(user.id, { $set: data }, { new: true, runValidators: true })
      .select("name email mobile image role")
      .lean();
    if (!account) return fail("Account not found", 404);
    return ok(account);
  } catch (error) {
    return handleError(error);
  }
}

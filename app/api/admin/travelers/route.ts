import { tenantModel } from "@/lib/tenant-db";
import { connectDB } from "@/lib/db";
import { ok, fail, handleError, requireApiRole } from "@/lib/api";
import { adminTravelerSchema } from "@/lib/validations";
import "@/models";
import User from "@/models/User";
import { getBusiness } from "@/lib/business";

export async function POST(request: Request) {
  try {
    await requireApiRole(["admin"]);
    const data = adminTravelerSchema.parse(await request.json());
    await connectDB();
    const business = await getBusiness();

    const email = data.email.toLowerCase();
    const existing = await (await tenantModel(User)).findOne({ email });
    if (existing && existing.role !== "vendor_traveler" && existing.role !== "traveler") {
      return fail("This email already belongs to an admin or partner account", 409);
    }

    const traveler = await (await tenantModel(User)).findOneAndUpdate(
      { email },
      {
        $setOnInsert: {
          email,
          role: "vendor_traveler",
          businessId: business._id,
        },
        $set: {
          name: data.name,
          mobile: data.mobile,
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );

    return ok({ id: String(traveler._id), created: !existing }, existing ? 200 : 201);
  } catch (err) {
    return handleError(err);
  }
}

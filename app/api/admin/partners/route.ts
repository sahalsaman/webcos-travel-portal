import { tenantModel } from "@/lib/tenant-db";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { ok, fail, handleError, requireApiRole } from "@/lib/api";
import { adminPartnerInviteSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import "@/models";
import User from "@/models/User";
import Partner from "@/models/Partner";
import Notification from "@/models/Notification";

async function uniquePartnerSlug(base: string) {
  const root = slugify(base) || "partner";
  let slug = root;
  let i = 1;
  while (await (await tenantModel(Partner)).exists({ slug })) slug = `${root}-${i++}`;
  return slug;
}

export async function POST(request: Request) {
  try {
    await requireApiRole(["admin"]);
    const data = adminPartnerInviteSchema.parse(await request.json());
    await connectDB();

    if (await (await tenantModel(User)).exists({ email: data.email })) {
      return fail("An account with this email already exists", 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await (await tenantModel(User)).create({
      name: data.name,
      email: data.email,
      mobile: data.mobile,
      password: passwordHash,
      role: "partner",
    });

    const slug = await uniquePartnerSlug(data.businessName);
    const partner = await (await tenantModel(Partner)).create({
      user: user._id,
      businessName: data.businessName,
      slug,
      partnerType: data.partnerType,
      contactEmail: data.email,
      contactPhone: data.mobile,
      status: data.status,
      defaultCommission: data.defaultCommission,
    });

    await (await tenantModel(Notification)).create({
      user: user._id,
      type: "system",
      title: data.status === "approved" ? "Partner account invited" : "Partner invite created",
      message:
        data.status === "approved"
          ? "Your partner account is ready. Log in with the credentials shared by the admin."
          : "Your partner account has been created and is pending admin approval.",
    });

    return ok(
      {
        id: String(partner._id),
        userId: String(user._id),
        slug,
        email: data.email,
        temporaryPassword: data.password,
        status: data.status,
      },
      201,
    );
  } catch (err) {
    return handleError(err);
  }
}

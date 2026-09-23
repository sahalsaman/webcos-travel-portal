import { getBusiness } from "@/lib/business";
import { authorizeSuperAdmin } from "@/lib/super-admin";
import { tenantModel } from "@/lib/tenant-db";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { connectDB } from "@/lib/db";
import { loginSchema } from "@/lib/validations";
import User from "@/models/User";
import Partner from "@/models/Partner";
import Employee from "@/models/Employee";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const superAdmin = await authorizeSuperAdmin(parsed.data.email, parsed.data.password);
        if (superAdmin) return superAdmin;
        const business = await getBusiness();
        await connectDB();
        const user = await (await tenantModel(User)).findOne({ email: parsed.data.email })
          .select("+password")
          .lean<{
            _id: unknown;
            name: string;
            email: string;
            password?: string;
            role: string;
            image?: string;
          }>();

        if (!user?.password) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.password);
        if (!ok) return null;

        // Attach partner slug so white-label links are one hop away in the UI.
        let partnerSlug: string | undefined;
        if (user.role === "partner") {
          const partner = await (await tenantModel(Partner)).findOne({ user: user._id })
            .select("slug")
            .lean<{ slug: string }>();
          partnerSlug = partner?.slug;
        }

        if (user.role === "employee") {
          const employee = await (await tenantModel(Employee)).findOne({
            user: user._id,
            status: "active",
            portalAccess: true,
          }).select("_id");
          if (!employee) return null;
        }

        return {
          id: String(user._id),
          businessId: String(business._id),
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          partnerSlug,
        };
      },
    }),
  ],
});

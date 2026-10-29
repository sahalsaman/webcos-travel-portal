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
import mongoose from "mongoose";
import { businessModel } from "@/lib/business";
import { configuredTenantDatabase } from "@/lib/db";
import { headers } from "next/headers";
import { normalisePhone, verifyPhoneOtp } from "@/lib/phone-otp";

const portalOnlyRoles = new Set(["admin", "tenant", "tenant_employee"]);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {}, phone: {}, otp: {} },
      async authorize(credentials) {
        const requestedPhone = typeof credentials?.phone === "string" ? credentials.phone : "";
        const requestedOtp = typeof credentials?.otp === "string" ? credentials.otp : "";
        if (requestedPhone && requestedOtp) {
          try {
            const phone = normalisePhone(requestedPhone);
            if (!await verifyPhoneOtp(phone, requestedOtp)) return null;
            const business = await getBusiness();
            await connectDB();
            const legacyIndianPhone = phone.startsWith("+91") ? phone.slice(3) : "";
            const user = await (await tenantModel(User)).findOne({ phone: { $in: [phone, legacyIndianPhone].filter(Boolean) } }).lean<{ _id: unknown; name: string; email: string; role: string; image?: string }>();
            if (!user || user.role !== "tenant_traveler") return null;
            return { id: String(user._id), businessId: String(business._id), name: user.name, email: user.email, image: user.image, role: user.role };
          } catch {
            return null;
          }
        }
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const portalClient = (await headers()).get("x-portal-client");
        const isPublicWebsiteLogin = portalClient === "tenant-website" || portalClient === "voibee-site";
        const siteLoginBlocked = (role: string) => isPublicWebsiteLogin && portalOnlyRoles.has(role);

        // Resolve the request host first. The same email may exist as a
        // platform admin and as an agency owner; the portal host decides which
        // account is being used.
        let business;
        try { business = await getBusiness(); } catch {
          const superAdmin = await authorizeSuperAdmin(parsed.data.email, parsed.data.password);
          if (superAdmin) return siteLoginBlocked(superAdmin.role) ? null : superAdmin;
          await connectDB();
          const registry = await businessModel();
          const businesses = await registry.find({ status: "active" }).lean();
          const db = mongoose.connection.useDb(configuredTenantDatabase(), { useCache: true });
          const users = db.models.User || db.model("User", User.schema);
          for (const candidate of businesses) {
            const candidateUser = await users.findOne({ email: parsed.data.email, businessId: candidate._id }).select("+password").lean<{ _id: unknown; name: string; email: string; password?: string; role: string; image?: string }>();
            if (!candidateUser?.password || !["tenant", "tenant_employee", "tenant_partner", "tenant_traveler"].includes(candidateUser.role)) continue;
            if (!await bcrypt.compare(parsed.data.password, candidateUser.password)) continue;
            if (siteLoginBlocked(candidateUser.role)) return null;
            return { id: String(candidateUser._id), businessId: String(candidate._id), name: candidateUser.name, email: candidateUser.email, image: candidateUser.image, role: candidateUser.role };
          }
          return null;
        }
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

        if (!user?.password) {
          const superAdmin = await authorizeSuperAdmin(parsed.data.email, parsed.data.password);
          return superAdmin && !siteLoginBlocked(superAdmin.role) ? superAdmin : null;
        }

        const ok = await bcrypt.compare(parsed.data.password, user.password);
        if (!ok) {
          const superAdmin = await authorizeSuperAdmin(parsed.data.email, parsed.data.password);
          return superAdmin && !siteLoginBlocked(superAdmin.role) ? superAdmin : null;
        }

        if (siteLoginBlocked(user.role)) return null;

        // Attach partner slug so white-label links are one hop away in the UI.
        let partnerSlug: string | undefined;
        if (user.role === "tenant_partner") {
          const partner = await (await tenantModel(Partner)).findOne({ user: user._id })
            .select("slug")
            .lean<{ slug: string }>();
          partnerSlug = partner?.slug;
        }

        if (user.role === "tenant_employee") {
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

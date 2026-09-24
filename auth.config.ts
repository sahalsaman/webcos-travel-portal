import { businessModel, getBusiness } from "@/lib/business";
import type { NextAuthConfig } from "next-auth";

/** JWT sessions are bound to the active business on every request. */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = (user as { id?: string }).id ?? token.sub;
        token.role = (user as { role?: string }).role;
        token.businessId = user.businessId;
        token.partnerSlug = (user as { partnerSlug?: string }).partnerSlug;
      }
      return token;
    },
    async session({ session, token }) {
      const platformAdmin = token.role === "admin" && !token.businessId;
      const business = platformAdmin ? null : await getBusiness().catch(async () => {
        if (!token.businessId) return null;
        const model = await businessModel();
        return model.findOne({ _id: token.businessId, status: "active" }).lean();
      });
      if (!platformAdmin && (!business || String(business._id) !== token.businessId)) {
        return { ...session, user: undefined } as unknown as typeof session;
      }
      if (session.user) {
        session.user.businessId = token.businessId as string | undefined;
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.partnerSlug = token.partnerSlug as string | undefined;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

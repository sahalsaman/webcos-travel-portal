import { tenantModel } from "@/lib/tenant-db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import { ADMIN_PORTAL_PAGES, adminPortalPageKeyForPath, type AdminPortalPageKey, type Role } from "@/lib/constants";
import Employee from "@/models/Employee";

export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: Role;
  partnerSlug?: string;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  return (session?.user as SessionUser) ?? null;
}

/** Redirect to /login if not signed in. */
export async function requireUser(callbackUrl?: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(
      callbackUrl ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/login",
    );
  }
  return user;
}

/** Redirect home if the signed-in user lacks one of the allowed roles. */
export async function requireRole(roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/");
  return user;
}


export async function requireAdminPortalAccess() {
  const user = await requireRole(["admin", "employee"]);
  if (user.role === "admin") {
    return {
      user,
      accessPages: ADMIN_PORTAL_PAGES.map((page) => page.key),
    };
  }

  await connectDB();
  const employee = await (await tenantModel(Employee)).findOne({
    user: user.id,
    status: "active",
    portalAccess: true,
  })
    .select("portalPages designation")
    .lean<{ portalPages?: AdminPortalPageKey[]; designation?: string }>();

  const accessPages = employee?.portalPages ?? [];
  if (!employee || accessPages.length === 0) redirect("/");

  const pathname = (await headers()).get("x-portal-pathname") ?? "/admin";
  const currentPage = adminPortalPageKeyForPath(pathname);
  if (!accessPages.includes(currentPage)) {
    const firstPage = ADMIN_PORTAL_PAGES.find((page) => accessPages.includes(page.key));
    redirect(firstPage?.href ?? "/");
  }

  return { user, accessPages, designation: employee.designation };
}

export const dynamic = "force-dynamic";
import { BusinessBrand } from "@/components/business-brand";
import { getBrand } from "@/lib/business";
import { requireAdminPortalAccess } from "@/lib/session";
import { RoleShell } from "@/components/dashboard/role-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, accessPages, designation } = await requireAdminPortalAccess();
  const role = user.role === "vendor_employee" ? "employee" : "admin";
  return (
    <BusinessBrand brand={await getBrand()}><RoleShell
      role={role}
      accessPages={accessPages}
      roleLabel={role === "employee" ? designation || "Employee" : undefined}
      user={{ name: user.name, email: user.email, image: user.image }}
    >
      {children}
    </RoleShell></BusinessBrand>
  );
}

export const dynamic = "force-dynamic";
import { BusinessBrand } from "@/components/business-brand";
import { getBrand } from "@/lib/business";
import { requireTenantPortalAccess } from "@/lib/session";
import { RoleShell } from "@/components/dashboard/role-shell";

export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, accessPages } = await requireTenantPortalAccess();
  const role = user.role === "tenant_employee" ? "tenant_employee" : "tenant";
  return (
    <BusinessBrand brand={await getBrand()}><RoleShell
      role={role}
      accessPages={accessPages}
      user={{ name: user.name, email: user.email, image: user.image }}
    >
      {children}
    </RoleShell></BusinessBrand>
  );
}

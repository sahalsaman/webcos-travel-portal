export const dynamic = "force-dynamic";
import { BusinessBrand } from "@/components/business-brand";
import { getBrand } from "@/lib/business";
import { requireTenantPortalAccess } from "@/lib/session";
import { RoleShell } from "@/components/dashboard/role-shell";
import { CurrencyProvider } from "@/components/currency/currency-provider";
import { getSettings } from "@/models/Settings";

export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, accessPages } = await requireTenantPortalAccess();
  const role = user.role === "tenant_employee" ? "tenant_employee" : "tenant";
  const settings = await getSettings();
  return (
    <BusinessBrand brand={await getBrand()}><CurrencyProvider initialCurrency={settings.currency} amountsAreInCurrency><RoleShell
      role={role}
      accessPages={accessPages}
      user={{ name: user.name, email: user.email, image: user.image }}
    >
      {children}
    </RoleShell></CurrencyProvider></BusinessBrand>
  );
}

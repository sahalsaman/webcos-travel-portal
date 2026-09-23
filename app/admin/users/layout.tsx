import { AdminSectionNav } from "@/components/admin/admin-section-nav";

export default function UsersLayout({ children }: { children: React.ReactNode }) {
  return <div className="space-y-5"><AdminSectionNav items={[{ href: "/admin/users/customers", label: "Customers" }, { href: "/admin/users/partners", label: "Partners" }, { href: "/admin/users/suppliers", label: "Suppliers" }]} />{children}</div>;
}

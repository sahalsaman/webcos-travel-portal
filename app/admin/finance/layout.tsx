import { AdminSectionNav } from "@/components/admin/admin-section-nav";

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return <div className="space-y-5"><AdminSectionNav items={[{ href: "/admin/finance/dashboard", label: "Dashboard" }, { href: "/admin/finance/earnings", label: "Earnings" }, { href: "/admin/finance/expenses", label: "Expenses" }, { href: "/admin/finance/invoices", label: "Invoices" }]} />{children}</div>;
}

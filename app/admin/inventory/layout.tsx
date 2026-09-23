import { AdminSectionNav } from "@/components/admin/admin-section-nav";

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  return <div className="space-y-5"><AdminSectionNav items={[{ href: "/admin/inventory/packages", label: "Packages" }, { href: "/admin/inventory/destinations", label: "Destinations" }, { href: "/admin/inventory/activities", label: "Activities" }, { href: "/admin/inventory/hotels", label: "Hotels" }, { href: "/admin/inventory/vehicles", label: "Vehicles" }]} />{children}</div>;
}

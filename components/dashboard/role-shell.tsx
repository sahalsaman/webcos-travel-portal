"use client";

import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  Settings,
  FileBarChart,
  Wallet,
  Link2,
  Compass,
  Heart,
  UserCircle,
  ShoppingBag,
  Megaphone,
  ContactRound,
  Boxes,
  Star,
  BriefcaseBusiness,
} from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/dashboard/shell";
import type { TenantPortalPageKey } from "@/lib/constants";

const NAVS: Record<string, { label: string; items: NavItem[] }> = {
  tenant: {
    label: "Tenant portal",
    items: [
      { href: "/tenant", label: "Dashboard", icon: LayoutDashboard, accessKey: "dashboard" },
      { href: "/tenant/lms", label: "Bookings & LMS", icon: ContactRound, accessKey: "lms", children: [
        { href: "/tenant/lms/bookings", label: "Bookings", icon: CalendarCheck },
        { href: "/tenant/lms/activity-bookings", label: "Activity Bookings", icon: CalendarCheck },
        { href: "/tenant/lms/leads", label: "Leads", icon: ContactRound },
        { href: "/tenant/lms/quotations", label: "Quotations", icon: FileBarChart },
        { href: "/tenant/lms/tickets", label: "Tickets", icon: CalendarCheck },
        { href: "/tenant/lms/hotels", label: "Hotel Reservations", icon: CalendarCheck },
        { href: "/tenant/lms/visas", label: "Visa Tracking", icon: CalendarCheck },
      ] },
      { href: "/tenant/users", label: "Users", icon: Users, accessKey: "users", children: [
        { href: "/tenant/users/customers", label: "Customers", icon: Users },
        { href: "/tenant/users/partners", label: "Partners", icon: Users },
        { href: "/tenant/users/suppliers", label: "Suppliers", icon: Users },
      ] },
      { href: "/tenant/inventory", label: "Inventory", icon: Boxes, accessKey: "inventory", children: [
        { href: "/tenant/inventory/packages", label: "Packages", icon: Boxes },
        { href: "/tenant/inventory/destinations", label: "Destinations", icon: Compass },
        { href: "/tenant/inventory/activities", label: "Activities", icon: Star },
        { href: "/tenant/inventory/hotels", label: "Hotels", icon: CalendarCheck },
        { href: "/tenant/inventory/vehicles", label: "Transportation", icon: CalendarCheck },
      ] },
      { href: "/tenant/hrm", label: "HRM", icon: BriefcaseBusiness, accessKey: "hrm", children: [
        { href: "/tenant/hrm", label: "Dashboard", icon: LayoutDashboard, exact: true },
        { href: "/tenant/hrm/tasks", label: "Tasks", icon: CalendarCheck },
        { href: "/tenant/hrm/attendance", label: "Attendance", icon: CalendarCheck },
        { href: "/tenant/hrm/leaves", label: "Leave", icon: CalendarCheck },
        { href: "/tenant/hrm/payroll", label: "Payroll", icon: Wallet },
        { href: "/tenant/hrm/employees", label: "Employees", icon: Users },
      ] },
      { href: "/tenant/finance", label: "Finance", icon: Wallet, accessKey: "finance", children: [
        { href: "/tenant/finance/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/tenant/finance/earnings", label: "Earnings", icon: Wallet },
        { href: "/tenant/finance/expenses", label: "Expenses", icon: Wallet },
        { href: "/tenant/finance/invoices", label: "Invoices", icon: FileBarChart },
      ] },
      { href: "/tenant/reputation", label: "ORM", icon: Star, accessKey: "reputation" },
      { href: "/tenant/reports", label: "Reports", icon: FileBarChart, accessKey: "reports" },
      { href: "/tenant/campaigns", label: "Marketing Campaigns", icon: Megaphone, accessKey: "campaigns" },
      { href: "/tenant/settings", label: "Settings", icon: Settings, accessKey: "settings" },
    ],
  },
  tenant_partner: {
    label: "Partner",
    items: [
      { href: "/partner", label: "Dashboard", icon: LayoutDashboard },
      { href: "/partner/browse", label: "Browse Packages", icon: Compass },
      { href: "/partner/links", label: "My Links", icon: Link2 },
      { href: "/partner/bookings", label: "Bookings", icon: CalendarCheck },
      { href: "/partner/earnings", label: "Earnings", icon: Wallet },
      { href: "/partner/profile", label: "Profile", icon: UserCircle },
    ],
  },
  tenant_traveler: {
    label: "Traveler",
    items: [
      { href: "/traveler", label: "Dashboard", icon: LayoutDashboard },
      { href: "/traveler/bookings", label: "My Bookings", icon: ShoppingBag },
      { href: "/traveler/wishlist", label: "Wishlist", icon: Heart },
    ],
  },
};

export function RoleShell({
  role,
  user,
  children,
  accessPages,
  roleLabel,
}: {
  role: "tenant" | "tenant_employee" | "tenant_partner" | "tenant_traveler";
  user: { name?: string | null; email?: string | null; image?: string | null };
  children: React.ReactNode;
  accessPages?: TenantPortalPageKey[];
  roleLabel?: string;
}) {
  const cfg = role === "tenant_employee" ? NAVS.tenant : NAVS[role];
  const allowed = accessPages ? new Set(accessPages) : null;
  const items = allowed
    ? cfg.items.filter((item) => !item.accessKey || allowed.has(item.accessKey as TenantPortalPageKey))
    : cfg.items;

  return (
    <DashboardShell nav={items} roleLabel={roleLabel || cfg.label} user={user}>
      {children}
    </DashboardShell>
  );
}

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
import type { AdminPortalPageKey } from "@/lib/constants";

const NAVS: Record<string, { label: string; items: NavItem[] }> = {
  admin: {
    label: "Admin",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, accessKey: "dashboard" },
      { href: "/admin/lms", label: "Bookings & LMS", icon: ContactRound, accessKey: "lms", children: [
        { href: "/admin/lms/bookings", label: "Bookings", icon: CalendarCheck },
        { href: "/admin/lms/activity-bookings", label: "Activity Bookings", icon: CalendarCheck },
        { href: "/admin/lms/leads", label: "Leads", icon: ContactRound },
        { href: "/admin/lms/quotations", label: "Quotations", icon: FileBarChart },
        { href: "/admin/lms/tickets", label: "Tickets", icon: CalendarCheck },
        { href: "/admin/lms/hotels", label: "Hotel Reservations", icon: CalendarCheck },
        { href: "/admin/lms/visas", label: "Visa Tracking", icon: CalendarCheck },
      ] },
      { href: "/admin/users", label: "Users", icon: Users, accessKey: "users", children: [
        { href: "/admin/users/customers", label: "Customers", icon: Users },
        { href: "/admin/users/partners", label: "Partners", icon: Users },
        { href: "/admin/users/suppliers", label: "Suppliers", icon: Users },
      ] },
      { href: "/admin/inventory", label: "Inventory", icon: Boxes, accessKey: "inventory", children: [
        { href: "/admin/inventory/packages", label: "Packages", icon: Boxes },
        { href: "/admin/inventory/destinations", label: "Destinations", icon: Compass },
        { href: "/admin/inventory/activities", label: "Activities", icon: Star },
        { href: "/admin/inventory/hotels", label: "Hotels", icon: CalendarCheck },
        { href: "/admin/inventory/vehicles", label: "Vehicles", icon: CalendarCheck },
      ] },
      { href: "/admin/hrm", label: "HRM", icon: BriefcaseBusiness, accessKey: "hrm", children: [
        { href: "/admin/hrm", label: "Dashboard", icon: LayoutDashboard, exact: true },
        { href: "/admin/hrm/tasks", label: "Tasks", icon: CalendarCheck },
        { href: "/admin/hrm/attendance", label: "Attendance", icon: CalendarCheck },
        { href: "/admin/hrm/leaves", label: "Leave", icon: CalendarCheck },
        { href: "/admin/hrm/payroll", label: "Payroll", icon: Wallet },
        { href: "/admin/hrm/employees", label: "Employees", icon: Users },
      ] },
      { href: "/admin/finance", label: "Finance", icon: Wallet, accessKey: "finance", children: [
        { href: "/admin/finance/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/finance/earnings", label: "Earnings", icon: Wallet },
        { href: "/admin/finance/expenses", label: "Expenses", icon: Wallet },
        { href: "/admin/finance/invoices", label: "Invoices", icon: FileBarChart },
      ] },
      { href: "/admin/reputation", label: "ORM", icon: Star, accessKey: "reputation" },
      { href: "/admin/reports", label: "Reports", icon: FileBarChart, accessKey: "reports" },
      { href: "/admin/campaigns", label: "Marketing Campaigns", icon: Megaphone, accessKey: "campaigns" },
      { href: "/admin/settings", label: "Settings", icon: Settings, accessKey: "settings" },
    ],
  },
  partner: {
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
  traveler: {
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
  role: "admin" | "employee" | "partner" | "traveler";
  user: { name?: string | null; email?: string | null; image?: string | null };
  children: React.ReactNode;
  accessPages?: AdminPortalPageKey[];
  roleLabel?: string;
}) {
  const cfg = role === "employee" ? NAVS.admin : NAVS[role];
  const allowed = accessPages ? new Set(accessPages) : null;
  const items = allowed
    ? cfg.items.filter((item) => !item.accessKey || allowed.has(item.accessKey as AdminPortalPageKey))
    : cfg.items;

  return (
    <DashboardShell nav={items} roleLabel={roleLabel || cfg.label} user={user}>
      {children}
    </DashboardShell>
  );
}

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
  Stars,
} from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/dashboard/shell";
import type { TenantPortalPageKey } from "@/lib/constants";

const NAVS: Record<string, { label: string; items: NavItem[] }> = {
  tenant: {
    label: "Tenant portal",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, accessKey: "dashboard" },
      { href: "/ai", label: "AI Assistant", icon: Stars, accessKey: "ai" },
      { href: "/lms", label: "Bookings & LMS", icon: ContactRound, accessKey: "lms", children: [
        { href: "/lms/bookings", label: "Bookings", icon: CalendarCheck },
        { href: "/lms/activity-bookings", label: "Activity Bookings", icon: CalendarCheck },
        { href: "/lms/leads", label: "Leads", icon: ContactRound },
        { href: "/lms/quotations", label: "Quotations", icon: FileBarChart },
        { href: "/lms/tickets", label: "Tickets", icon: CalendarCheck },
        { href: "/lms/hotels", label: "Hotel Reservations", icon: CalendarCheck },
        { href: "/lms/visas", label: "Visa Tracking", icon: CalendarCheck },
      ] },
      { href: "/users", label: "Users", icon: Users, accessKey: "users", children: [
        { href: "/users/customers", label: "Customers", icon: Users },
        { href: "/users/partners", label: "Partners", icon: Users },
        { href: "/users/suppliers", label: "Suppliers", icon: Users },
      ] },
      { href: "/inventory", label: "Inventory", icon: Boxes, accessKey: "inventory", children: [
        { href: "/inventory/packages", label: "Packages", icon: Boxes },
        { href: "/inventory/destinations", label: "Destinations", icon: Compass },
        { href: "/inventory/activities", label: "Activities", icon: Star },
        { href: "/inventory/hotels", label: "Hotels", icon: CalendarCheck },
        { href: "/inventory/vehicles", label: "Transportation", icon: CalendarCheck },
      ] },
      { href: "/hrm", label: "HRM", icon: BriefcaseBusiness, accessKey: "hrm", children: [
        { href: "/hrm", label: "Dashboard", icon: LayoutDashboard, exact: true },
        { href: "/hrm/tasks", label: "Tasks", icon: CalendarCheck },
        { href: "/hrm/attendance", label: "Attendance", icon: CalendarCheck },
        { href: "/hrm/leaves", label: "Leave", icon: CalendarCheck },
        { href: "/hrm/payroll", label: "Payroll", icon: Wallet },
        { href: "/hrm/employees", label: "Employees", icon: Users },
      ] },
      { href: "/finance", label: "Finance", icon: Wallet, accessKey: "finance", children: [
        { href: "/finance/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/finance/earnings", label: "Earnings", icon: Wallet },
        { href: "/finance/expenses", label: "Expenses", icon: Wallet },
        { href: "/finance/invoices", label: "Invoices", icon: FileBarChart },
      ] },
      { href: "/reputation", label: "ORM", icon: Star, accessKey: "reputation" },
      { href: "/reports", label: "Reports", icon: FileBarChart, accessKey: "reports" },
      { href: "/campaigns", label: "Marketing Campaigns", icon: Megaphone, accessKey: "campaigns" },
      { href: "/settings", label: "Settings", icon: Settings, accessKey: "settings" },
    ],
  },

};

export function RoleShell({
  role,
  user,
  children,
  accessPages,
}: {
  role: "tenant" | "tenant_employee" | "tenant_partner" | "tenant_traveler";
  user: { name?: string | null; email?: string | null; image?: string | null };
  children: React.ReactNode;
  accessPages?: TenantPortalPageKey[];
}) {
  const cfg = role === "tenant_employee" ? NAVS.tenant : NAVS[role];
  const allowed = accessPages ? new Set(accessPages) : null;
  const items = allowed
    ? cfg.items.filter((item) => !item.accessKey || allowed.has(item.accessKey as TenantPortalPageKey))
    : cfg.items;

  return (
    <DashboardShell nav={items} user={user}>
      {children}
    </DashboardShell>
  );
}

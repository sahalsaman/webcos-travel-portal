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
      { href: "/admin/lms", label: "Bookings & LMS", icon: ContactRound, accessKey: "lms" },
      { href: "/admin/users", label: "Users", icon: Users, accessKey: "users" },
      { href: "/admin/inventory", label: "Inventory", icon: Boxes, accessKey: "inventory" },
      { href: "/admin/hrm", label: "HRM", icon: BriefcaseBusiness, accessKey: "hrm" },
      { href: "/admin/finance", label: "Finance", icon: Wallet, accessKey: "finance" },
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

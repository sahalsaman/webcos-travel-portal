"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BedDouble, CalendarCheck, FileText, Sparkles, Stamp, Tickets, UserRoundSearch } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/admin/lms/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/admin/lms/activity-bookings", label: "Activity Bookings", icon: Sparkles },
  { href: "/admin/lms/leads", label: "Leads", icon: UserRoundSearch },
  { href: "/admin/lms/quotations", label: "Quotations", icon: FileText },
  { href: "/admin/lms/tickets", label: "Tickets", icon: Tickets },
  { href: "/admin/lms/hotels", label: "Hotel Reservations", icon: BedDouble },
  { href: "/admin/lms/visas", label: "Visa Tracking", icon: Stamp },
];

export function LmsNav() {
  const pathname = usePathname();
  return <div className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-muted/40 p-1">
    {tabs.map((tab) => <Link key={tab.href} href={tab.href} className={cn("inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-md px-4 text-sm font-medium", pathname.startsWith(tab.href) ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}><tab.icon className="size-4" />{tab.label}</Link>)}
  </div>;
}

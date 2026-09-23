"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function AdminSectionNav({ items }: { items: { href: string; label: string; exact?: boolean }[] }) {
  const pathname = usePathname();
  return <div className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-muted/40 p-1">{items.map((item) => { const active = item.exact ? pathname === item.href : pathname.startsWith(item.href); return <Link key={item.href} href={item.href} className={cn("inline-flex h-9 items-center whitespace-nowrap rounded-md px-4 text-sm font-medium", active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{item.label}</Link>; })}</div>;
}

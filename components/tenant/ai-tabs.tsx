"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  ["/tenant/ai", "AI Assistance"],
  ["/tenant/ai/destinations", "Generate destinations"],
  ["/tenant/ai/packages", "Generate packages"],
  ["/tenant/ai/hotels", "Generate hotels"],
] as const;

export function AiTabs() {
  const pathname = usePathname();
  return <nav className="flex flex-wrap gap-2" aria-label="AI workspace sections">{tabs.map(([href, label]) => {
    const active = pathname === href;
    return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("rounded-full border px-4 py-2 text-sm font-medium transition-colors", active ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-border bg-background hover:border-primary/40 hover:bg-primary/5 hover:text-primary")}>{label}</Link>;
  })}</nav>;
}

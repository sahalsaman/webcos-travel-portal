"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ChevronDown, Menu, X, LogOut, ExternalLink, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useBusinessBrand } from "@/components/business-brand";
import { NotificationMenu } from "@/components/site/notification-menu";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  accessKey?: string;
  exact?: boolean;
  children?: NavItem[];
}

export function DashboardShell({
  nav,
  roleLabel,
  user,
  children,
}: {
  nav: NavItem[];
  roleLabel: string;
  user: { name?: string | null; email?: string | null; image?: string | null };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const brand = useBusinessBrand();

  const isActive = (item: NavItem) =>
    pathname === item.href || (!item.exact && item.href !== nav[0]?.href && pathname.startsWith(item.href)) || Boolean(item.children?.some(isActive));

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <Link href="/" className="flex h-20 items-center px-5 font-bold text-lg">
          {brand.logoUrl ? <Image src={brand.logoUrl} alt={brand.name} width={192} height={56} unoptimized className="h-14 w-48 max-w-full object-contain object-left" /> : <span>{brand.name}</span>}
      </Link>
      {/* <div className="px-5 pb-3">
        <Badge variant="secondary">{roleLabel}</Badge>
      </div> */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {nav.map((item) => (
          item.children?.length ? <NavigationGroup key={item.href} item={item} pathname={pathname} onNavigate={() => setOpen(false)} /> : <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors", isActive(item) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}><item.icon className="size-5" />{item.label}</Link>
        ))}
      </nav>
      <div className="border-t border-border p-3">
        <Link
          href={brand.siteUrl}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <ExternalLink className="size-4" /> View site
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <LogOut className="size-4" /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-secondary/30">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:block">
        <div className="sticky top-0 h-screen">{SidebarContent}</div>
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-border bg-card">
            {SidebarContent}
          </aside>
        </div>
      ) : null}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
          <div className="ml-auto flex items-center gap-3">
            <NotificationMenu />
            <ThemeToggle />
            <div className="flex items-center gap-2">
              <Avatar src={user.image} name={user.name ?? "User"} size={34} />
              <div className="hidden sm:block">
                <p className="text-sm font-medium leading-tight">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function NavigationGroup({ item, pathname, onNavigate }: { item: NavItem; pathname: string; onNavigate: () => void }) {
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const [expanded, setExpanded] = useState(active);
  // Start expanded for the active module, but always honour a user's collapse choice.
  const open = expanded;

  return <div className="space-y-1"><button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={open} className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors", active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}><item.icon className="size-5" /><span className="flex-1">{item.label}</span><ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} /></button>{open ? <div className="ml-6 space-y-1 border-l border-primary/20 py-1 pl-4">{item.children?.map((child) => { const childActive = pathname === child.href || (!child.exact && pathname.startsWith(`${child.href}/`)); return <Link key={child.href} href={child.href} onClick={onNavigate} className={cn("block rounded-md px-3 py-2 text-sm transition-colors", childActive ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}>{child.label}</Link>; })}</div> : null}</div>;
}

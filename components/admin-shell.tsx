"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { BookOpen, Building2, CircleHelp, CreditCard, LayoutDashboard, LogOut, Menu, X } from "lucide-react";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/tenants", label: "Tenants", icon: Building2 },
  { href: "/admin/invoices", label: "Invoices", icon: CreditCard },
  { href: "/admin/support", label: "Support tickets", icon: CircleHelp },
  { href: "/docs", label: "Documentation", icon: BookOpen },
];

export function AdminShell({ children, user }: { children: React.ReactNode; user: { name?: string | null; email?: string | null; image?: string | null } }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const sidebar = <div className="flex h-full flex-col"><Link href="/admin" className="flex h-20 items-center px-5"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-sky-300">Travel Portal</p><p className="mt-1 text-lg font-semibold text-white">Platform Admin</p></div></Link><nav className="flex-1 space-y-1 px-3">{links.map(({ href, label, icon: Icon, exact }) => { const active = exact ? pathname === href : pathname.startsWith(href); return <Link key={href} href={href} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-primary text-white shadow-lg" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}><Icon className="size-5" />{label}</Link>; })}</nav><div className="border-t border-white/10 p-3"><button onClick={() => signOut({ callbackUrl: "/login" })} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-white/10 hover:text-white"><LogOut className="size-4" />Sign out</button></div></div>;
  return <div className="flex min-h-screen bg-secondary/30"><aside className="hidden w-64 shrink-0 bg-slate-950 lg:block"><div className="sticky top-0 h-screen">{sidebar}</div></aside>{open && <div className="fixed inset-0 z-50 lg:hidden"><button aria-label="Close menu" className="absolute inset-0 bg-black/45" onClick={() => setOpen(false)} /><aside className="absolute left-0 top-0 h-full w-64 bg-slate-950">{sidebar}</aside></div>}<div className="flex min-w-0 flex-1 flex-col"><header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b bg-card/85 px-4 backdrop-blur sm:px-6"><Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(value => !value)} aria-label="Menu">{open ? <X /> : <Menu />}</Button><div className="min-w-0"><p className="text-sm font-semibold">Platform administration</p><p className="hidden text-xs text-muted-foreground sm:block">Manage your travel-agency SaaS platform</p></div><div className="ml-auto flex items-center gap-3"><ThemeToggle /><div className="flex items-center gap-2"><Avatar src={user.image} name={user.name || "Admin"} size={34} /><div className="hidden sm:block"><p className="text-sm font-medium leading-tight">{user.name || "Admin"}</p><p className="text-xs text-muted-foreground">{user.email}</p></div></div></div></header><main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main></div></div>;
}

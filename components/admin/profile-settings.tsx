"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Globe2, KeyRound, Loader2, Mail, MapPin, Pencil, Phone, ShieldCheck, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { CloudinaryImageGallery } from "@/components/admin/cloudinary-image-urls-field";
import Image from "next/image";

type ProfileUser = { name?: string | null; email?: string | null; mobile?: string | null; image?: string | null; role?: string };
type Business = { name: string; slug: string; siteUrl: string; address?: string; logoUrl?: string; status: string };
type Panel = "password" | "user" | "business" | null;

export function ProfileSettings({ user: initialUser, business: initialBusiness }: { user: ProfileUser; business: Business }) {
  const router = useRouter();
  const [panel, setPanel] = useState<Panel>(null);
  const [user, setUser] = useState<ProfileUser>(initialUser);
  const [business, setBusiness] = useState<Business>(initialBusiness);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/profile", { cache: "no-store" })
      .then(async (response) => ({ response, result: await response.json() }))
      .then(({ response, result }) => { if (active && response.ok && result.success) setUser(result.data); })
      .catch(() => undefined)
      .finally(() => { if (active) setLoadingProfile(false); });
    return () => { active = false; };
  }, []);

  const userName = user.name || "Portal user";
  const role = user.role === "vendor" ? "Agency owner" : user.role === "vendor_employee" ? "Agency employee" : user.role || "User";
  async function saveUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const payload = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    try { const response = await fetch("/api/admin/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const result = await response.json(); if (!response.ok || !result.success) throw new Error(result.message || "Could not update your profile"); setUser(result.data); setPanel(null); toast.success("User information updated"); router.refresh(); } catch (error) { toast.error((error as Error).message); }
  }
  async function saveBusiness(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const payload = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    try { const response = await fetch("/api/admin/business", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const result = await response.json(); if (!response.ok || !result.success) throw new Error(result.message || "Could not update business information"); setBusiness(result.data); setPanel(null); toast.success("Business information updated"); router.refresh(); } catch (error) { toast.error((error as Error).message); }
  }

  return <div className="max-w-3xl bg-white rounded-lg border border-border p-5 shadow-sm">
    <header className="flex flex-wrap items-center justify-between gap-5 border-b border-border pb-7"><div className="flex items-center gap-4"><Avatar src={user.image} name={userName} size={64} className="ring-4 ring-primary/10" /><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">My profile</p><h2 className="mt-1 text-2xl font-bold">{userName}</h2><p className="mt-1 text-sm text-muted-foreground">{user.email || "No account email"}</p></div></div><Button type="button" variant="outline" onClick={() => setPanel("password")}><KeyRound className="size-4" />Change password</Button></header>
    <div className="divide-y divide-border">
      <section className="grid gap-5 py-7 sm:grid-cols-[180px_1fr]"><div><p className="flex items-center gap-2 font-semibold"><UserRound className="size-4 text-primary" />Account</p><p className="mt-1 text-sm text-muted-foreground">Your portal access.</p></div><div><div className="mb-5 flex justify-end"><Button type="button" size="sm" variant="outline" onClick={() => setPanel("user")} disabled={loadingProfile}>{loadingProfile ? <Loader2 className="size-3.5 animate-spin" /> : <Pencil className="size-3.5" />}Edit user info</Button></div><dl className="grid gap-4 sm:grid-cols-2"><Info label="Name" value={userName} /><Info label="Email" value={user.email || "Not available"} icon={<Mail className="size-3.5" />} /><Info label="Phone" value={user.mobile || "Not added"} icon={<Phone className="size-3.5" />} /><Info label="Role" value={role} /><Info label="Password" value="Protected" icon={<ShieldCheck className="size-3.5 text-emerald-600" />} /></dl></div></section>
      <section className="grid gap-5 py-7 sm:grid-cols-[180px_1fr]"><div><p className="flex items-center gap-2 font-semibold"><Building2 className="size-4 text-primary" />Business</p><p className="mt-1 text-sm text-muted-foreground">Your agency profile.</p></div><div><div className="mb-5 flex justify-end"><Button type="button" size="sm" variant="outline" onClick={() => setPanel("business")}><Pencil className="size-3.5" />Edit business info</Button></div><div className="space-y-5"><div className="flex items-center gap-3">{business.logoUrl ? <Image src={business.logoUrl} alt={business.name} className="" width={100} height={100} /> : <div className="grid size-11 place-items-center rounded-lg bg-primary/10 font-bold text-primary">{business.name.slice(0, 1)}</div>}<div><p className="font-semibold">{business.name}</p><p className="text-sm text-muted-foreground">{business.slug}</p></div></div><dl className="grid gap-4 sm:grid-cols-2"><Info label="Website" value={business.siteUrl} icon={<Globe2 className="size-3.5" />} /><Info label="Address" value={business.address || "Not added"} icon={<MapPin className="size-3.5" />} /><Info label="Account status" value={business.status === "active" ? "Active" : business.status} icon={<CheckStatus active={business.status === "active"} />} /></dl></div></div></section>
    </div>
    {panel === "password" ? <SidePanel title="Change password" subtitle="Use a strong, unique password." onClose={() => setPanel(null)}><ChangePasswordForm onSaved={() => setPanel(null)} /></SidePanel> : null}
    {panel === "user" ? <SidePanel title="Edit user information" subtitle="Keep your account details up to date." onClose={() => setPanel(null)}><form className="space-y-5" onSubmit={saveUser}><div><Label htmlFor="profile-name">Name</Label><Input id="profile-name" name="name" className="mt-1.5" defaultValue={user.name ?? ""} required /></div><div><Label htmlFor="profile-email">Email</Label><Input id="profile-email" name="email" type="email" className="mt-1.5" defaultValue={user.email ?? ""} required /></div><div><Label htmlFor="profile-mobile">Phone</Label><Input id="profile-mobile" name="mobile" className="mt-1.5" defaultValue={user.mobile ?? ""} placeholder="Add phone number" /></div><input name="image" type="hidden" value={user.image ?? ""} /><div className="flex justify-end gap-2 border-t border-border pt-5"><Button type="button" variant="outline" onClick={() => setPanel(null)}>Cancel</Button><Button type="submit" variant="gradient">Save user info</Button></div></form></SidePanel> : null}
    {panel === "business" ? <SidePanel title="Edit business information" subtitle="This is shown across your travel portal." onClose={() => setPanel(null)}><form className="space-y-5" onSubmit={saveBusiness}><div><Label htmlFor="business-name">Business name</Label><Input id="business-name" name="name" className="mt-1.5" defaultValue={business.name} required /></div><div><Label htmlFor="business-url">Website</Label><Input id="business-url" name="siteUrl" type="url" className="mt-1.5" defaultValue={business.siteUrl} required /></div><div><Label htmlFor="business-address">Address</Label><Input id="business-address" name="address" className="mt-1.5" defaultValue={business.address ?? ""} placeholder="Business address" /></div><BusinessLogoPicker logoUrl={business.logoUrl ?? ""} /><div className="flex justify-end gap-2 border-t border-border pt-5"><Button type="button" variant="outline" onClick={() => setPanel(null)}>Cancel</Button><Button type="submit" variant="gradient">Save business info</Button></div></form></SidePanel> : null}
  </div>;
}

function BusinessLogoPicker({ logoUrl }: { logoUrl: string }) { const [value, setValue] = useState(logoUrl); return <><CloudinaryImageGallery label="Business logo" description="Use your Cloudinary-hosted logo so it remains available across the portal." images={value ? [value] : []} onChange={(images) => setValue(images[0] ?? "")} multiple={false} /><input name="logoUrl" type="hidden" value={value} /></>; }
function SidePanel({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode }) { return <div className="fixed inset-0 z-[90]"><button type="button" className="absolute inset-0 bg-black/45" onClick={onClose} aria-label={`Close ${title}`} /><aside role="dialog" aria-modal="true" aria-labelledby="profile-panel-title" className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-2xl"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 id="profile-panel-title" className="text-lg font-bold">{title}</h2><p className="text-sm text-muted-foreground">{subtitle}</p></div><Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close"><X className="size-5" /></Button></div><div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div></aside></div>; }
function Info({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) { return <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 flex items-center gap-1.5 break-all text-sm font-medium">{icon}{value}</p></div>; }
function CheckStatus({ active }: { active: boolean }) { return <span className={active ? "size-2 rounded-full bg-emerald-500" : "size-2 rounded-full bg-amber-500"} />; }

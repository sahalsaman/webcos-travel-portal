"use client";
import { useEffect, useState, type FormEvent } from "react";
import { signOut } from "next-auth/react";
interface Business { _id: string; name: string; slug: string; hosts: string[]; status: string; siteUrl: string }
export function BusinessManager() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function load() { const response = await fetch("/api/platform/businesses"); const result = await response.json(); if (!response.ok) throw new Error(result.message); setBusinesses(result.data); }
  useEffect(() => { const controller = new AbortController(); fetch("/api/platform/businesses", { signal: controller.signal }).then(r => r.json()).then(result => { if (!result.success) throw new Error(result.message); setBusinesses(result.data); }).catch(e => { if (e.name !== "AbortError") setMessage(String(e)); }); return () => controller.abort(); }, []);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; setBusy(true); setMessage("");
    try { const response = await fetch("/api/platform/businesses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form))) }); const result = await response.json(); if (!response.ok) throw new Error(result.message); form.reset(); await load(); setMessage("Business created. Its admin can now sign in at the configured portal host."); }
    catch (e) { setMessage(e instanceof Error ? e.message : "Unable to create business"); } finally { setBusy(false); }
  }
  async function toggle(business: Business) {
    setBusy(true);
    try { const response = await fetch("/api/platform/businesses", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: business._id, status: business.status === "active" ? "suspended" : "active" }) }); if (!response.ok) throw new Error("Unable to update business"); await load(); }
    catch (e) { setMessage(String(e)); } finally { setBusy(false); }
  }
  return <><button className="my-5 text-sm underline" onClick={() => signOut({ callbackUrl: "/login" })}>Sign out</button><div className="grid gap-8 lg:grid-cols-[1fr_380px]"><section className="space-y-4">{businesses.map(b => <article key={b._id} className="rounded-xl border bg-card p-6"><div className="flex justify-between gap-4"><h2 className="text-xl font-semibold">{b.name}</h2><span className="text-sm">{b.status}</span></div><p className="mt-2 text-sm text-muted-foreground">{b.slug} · {b.hosts.join(", ")}</p><div className="mt-4 flex gap-5 text-sm"><a className="underline" href={`//${b.hosts[0]}/admin`}>Open portal</a><a className="underline" href={b.siteUrl}>Visit website</a><button disabled={busy} className="underline" onClick={() => toggle(b)}>{b.status === "active" ? "Suspend" : "Activate"}</button></div></article>)}{!businesses.length && <p className="rounded-xl border p-8 text-muted-foreground">No businesses yet. Add your first agency.</p>}</section><form onSubmit={create} className="space-y-4 rounded-xl border bg-card p-6"><h2 className="text-xl font-semibold">Add a business</h2>{[
    ["name", "Business name", "text", "Voibee Holidays"], ["slug", "Business slug", "text", "voibee"], ["host", "Portal host (including local port)", "text", "voibee.portal.example.com"], ["siteUrl", "Website URL", "url", "https://www.voibee.com"], ["logoUrl", "Logo URL (optional)", "url", "https://..."], ["primaryColor", "Brand color", "color", "#0060e6"], ["adminName", "Agency admin name", "text", ""], ["adminEmail", "Agency admin email", "email", ""], ["adminPassword", "Initial password (12+ characters)", "password", ""],
  ].map(([name,label,type,placeholder]) => <label key={name} className="block text-sm font-medium">{label}<input className="mt-1 w-full rounded-md border bg-background p-2" name={name} type={type} placeholder={placeholder} defaultValue={type === "color" ? placeholder : undefined} required={name !== "logoUrl"} minLength={name === "adminPassword" ? 12 : undefined} autoComplete={type === "password" ? "new-password" : undefined} /></label>)}<button disabled={busy} className="w-full rounded-md bg-primary p-3 font-semibold text-white disabled:opacity-50">{busy ? "Saving…" : "Create business"}</button></form></div>{message && <p role="status" className="mt-6 rounded-lg border p-4">{message}</p>}</>;
}

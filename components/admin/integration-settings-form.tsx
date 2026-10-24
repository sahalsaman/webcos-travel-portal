"use client";

import { useState } from "react";
import { CheckCircle2, Eye, EyeOff, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type Platform = "CLOUDINARY" | "WHATSAPP_BUSINESS" | "PAYMENT_GATEWAY" | "FLIGHT_API";
type Credential = { platform: Platform; name: string; apikey: string; secretKey: string; url: string };
const blank: Credential = { platform: "CLOUDINARY", name: "", apikey: "", secretKey: "", url: "" };
const platformName: Record<Platform, string> = { CLOUDINARY: "Cloudinary", WHATSAPP_BUSINESS: "WhatsApp Business", PAYMENT_GATEWAY: "Payment gateway", FLIGHT_API: "Flight API" };

export function IntegrationSettingsForm({ credentials }: { credentials: Credential[] }) {
  const [items, setItems] = useState<Credential[]>(credentials);
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<Credential>({ ...blank });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  function openNew() { setDraft({ ...blank }); setShowSecret(false); setEditing("new"); }
  function openEdit(index: number) { setDraft({ ...items[index] }); setShowSecret(false); setEditing(index); }
  function close() { if (!saving && !testing) setEditing(null); }

  async function persist(next: Credential[], message = "Integration saved") {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/integrations", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credentials: next }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Could not save integration settings");
      setItems(result.data.credentials);
      toast.success(message);
      return true;
    } catch (error) {
      toast.error((error as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  function nextItems() { return editing === "new" ? [...items, draft] : items.map((item, index) => index === editing ? draft : item); }
  async function save() { if (await persist(nextItems())) setEditing(null); }
  async function testCloudinary() {
    if (draft.platform !== "CLOUDINARY" || !await persist(nextItems(), "Cloudinary credentials saved")) return;
    setTesting(true);
    try {
      const response = await fetch("/api/admin/integrations/cloudinary/test", { method: "POST" }); const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Cloudinary verification failed");
      toast.success("Cloudinary connected successfully");
    } catch (error) { toast.error((error as Error).message); } finally { setTesting(false); }
  }
  async function remove(index: number) { if (!window.confirm(`Remove ${platformName[items[index].platform]} integration?`)) return; await persist(items.filter((_, itemIndex) => itemIndex !== index), "Integration removed"); }

  return <div className="space-y-6">
    <Card><CardHeader className="flex-row items-start justify-between gap-4"><div><CardTitle>Third-party integrations</CardTitle><p className="mt-1 text-sm font-normal text-muted-foreground">Connections and credentials for this agency only.</p></div><Button type="button" variant="gradient" onClick={openNew}><Plus className="size-4" />Add integration</Button></CardHeader><CardContent>
      {items.length ? <div className="divide-y rounded-xl border border-border">{items.map((credential, index) => <div key={`${credential.platform}-${index}`} className="flex flex-wrap items-center justify-between gap-3 p-4"><div className="flex min-w-0 items-center gap-3"><div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-sm font-bold text-primary">{platformName[credential.platform].slice(0, 1)}</div><div><p className="font-semibold">{platformName[credential.platform]}</p><p className="text-sm text-muted-foreground">{credential.name || "Not configured"}</p></div></div><div className="flex items-center gap-2"><span className={`inline-flex items-center gap-1.5 text-xs font-medium ${credential.name && credential.apikey && credential.secretKey ? "text-emerald-700" : "text-amber-700"}`}><CheckCircle2 className="size-3.5" />{credential.name && credential.apikey && credential.secretKey ? "Configured" : "Needs details"}</span><Button type="button" variant="outline" size="sm" onClick={() => openEdit(index)}><Pencil className="size-3.5" />Edit</Button><Button type="button" variant="ghost" size="icon" aria-label={`Remove ${platformName[credential.platform]}`} onClick={() => void remove(index)}><Trash2 className="size-4" /></Button></div></div>)}</div> : <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">No integrations added yet. Add Cloudinary to import package images automatically.</div>}
    </CardContent></Card>
    <Card className="border-primary/20 bg-primary/5"><CardContent className="p-5 text-sm text-muted-foreground"><p className="font-semibold text-foreground">How package images work</p><p className="mt-1">External package image links are imported to your configured Cloudinary folder, then the package stores the returned Cloudinary URLs.</p></CardContent></Card>
    {editing !== null ? <div className="fixed inset-0 z-[90]"><button type="button" className="absolute inset-0 bg-black/45" onClick={close} aria-label="Close integration form" /><aside role="dialog" aria-modal="true" aria-labelledby="integration-drawer-title" className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-border bg-background shadow-2xl"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 id="integration-drawer-title" className="text-lg font-bold">{editing === "new" ? "Add integration" : `Edit ${platformName[draft.platform]}`}</h2><p className="text-sm text-muted-foreground">Enter credentials for this agency only.</p></div><Button type="button" variant="ghost" size="icon" onClick={close} aria-label="Close"><X className="size-5" /></Button></div><div className="min-h-0 flex-1 overflow-y-auto p-5"><div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><Label className="mb-1.5 block">Integration</Label><Select value={draft.platform} onChange={(event) => setDraft((current) => ({ ...current, platform: event.target.value as Platform }))}><option value="CLOUDINARY">Cloudinary</option><option value="WHATSAPP_BUSINESS">WhatsApp Business</option><option value="PAYMENT_GATEWAY">Payment gateway</option><option value="FLIGHT_API">Flight API</option></Select></div><div><Label className="mb-1.5 block">{draft.platform === "CLOUDINARY" ? "Cloud name" : draft.platform === "FLIGHT_API" ? "Provider name" : "Account name"}</Label><Input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} placeholder={draft.platform === "CLOUDINARY" ? "your-cloud-name" : draft.platform === "FLIGHT_API" ? "Amadeus, Duffel, Kiwi, etc." : "Account label"} /></div><div><Label className="mb-1.5 block">API key</Label><Input value={draft.apikey} onChange={(event) => setDraft((current) => ({ ...current, apikey: event.target.value }))} autoComplete="off" /></div><div><Label className="mb-1.5 block">Secret key</Label><div className="relative"><Input type={showSecret ? "text" : "password"} value={draft.secretKey} onChange={(event) => setDraft((current) => ({ ...current, secretKey: event.target.value }))} autoComplete="new-password" className="pr-10" /><button type="button" className="absolute inset-y-0 right-0 px-3 text-muted-foreground" onClick={() => setShowSecret((current) => !current)} aria-label={showSecret ? "Hide secret key" : "Show secret key"}>{showSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></div><div><Label className="mb-1.5 block">{draft.platform === "CLOUDINARY" ? "Upload folder" : "Endpoint / optional URL"}</Label><Input value={draft.url} onChange={(event) => setDraft((current) => ({ ...current, url: event.target.value }))} placeholder={draft.platform === "CLOUDINARY" ? "travel-packages" : "https://..."} /></div></div></div><div className="flex flex-wrap justify-end gap-3 border-t border-border p-4"><Button type="button" variant="outline" onClick={close} disabled={saving || testing}>Cancel</Button>{draft.platform === "CLOUDINARY" ? <Button type="button" variant="outline" onClick={() => void testCloudinary()} disabled={saving || testing}>{testing ? <Loader2 className="size-4 animate-spin" /> : null}Test Cloudinary</Button> : null}<Button type="button" variant="gradient" onClick={() => void save()} disabled={saving || testing}>{saving ? <Loader2 className="size-4 animate-spin" /> : null}Save integration</Button></div></aside></div> : null}
  </div>;
}

"use client";

import { useState } from "react";
import { CheckCircle2, Copy, Eye, EyeOff, Info, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type Platform = "CLOUDINARY" | "WABIS_API" | "RAZORPAY_API" | "FLIGHT_API" | "GEMINI_AI" | "META_API";
type WabisTemplates = { otp: string; booking: string; reminder: string; experience: string };
type Credential = { platform: Platform; name: string; apikey: string; secretKey: string; url: string; webhookSecret: string; alertEmail: string; languageCode: string; templates: WabisTemplates };
type InputCredential = Omit<Partial<Credential>, "templates"> & { platform: Platform; templates?: Partial<WabisTemplates> };

const blankTemplates: WabisTemplates = { otp: "", booking: "", reminder: "", experience: "" };
const blank: Credential = { platform: "CLOUDINARY", name: "", apikey: "", secretKey: "", url: "", webhookSecret: "", alertEmail: "", languageCode: "en", templates: blankTemplates };
const names: Record<Platform, string> = { CLOUDINARY: "Cloudinary", WABIS_API: "Wabis API", RAZORPAY_API: "Razorpay API", FLIGHT_API: "Flight API", GEMINI_AI: "Gemini AI", META_API: "Meta API" };
const templateLabels: Array<[keyof WabisTemplates, string, string]> = [
  ["otp", "OTP verification", "Code is sent as the first body variable."],
  ["booking", "Booking template", "Used for pending, confirmed, completed and every booking status change. It uses seven message variables."],
  ["reminder", "Reminder template", "Used for 2-day, tomorrow, today, and payment reminders."],
  ["experience", "After-trip experience", "For feedback after the trip completes."],
];
const templateFormats: Record<
  keyof WabisTemplates,
  {
    variables: { variable: string; sample: string }[];
    preview: string;
  }
> = {
  otp: {
    variables: [
      { variable: "{{1}} Verification code", sample: "654321" },
    ],
    preview: "Header: Verification code\n\nYour verification code is {{1}}. Do not share this code with anyone.\n\nFooter: Voibee Holidays",
  },

  booking: {
    variables: [
      { variable: "{{1}} Traveller name", sample: "Ananya" },
      { variable: "{{2}} Destination", sample: "Kerala" },
      { variable: "{{3}} Booking status", sample: "confirmed" },
      { variable: "{{4}} Travel date", sample: "12 Nov 2026" },
      { variable: "{{5}} Booking ID", sample: "VOI-12345" },
      {
        variable: "{{6}} Booking update",
        sample: "Our team will share the next steps with you shortly.",
      },
      {
        variable: "{{7}} Booking link",
        sample: "https://voibee.com/traveler/bookings",
      },
    ],
    preview: "Header: 🌴 Your Trip Booking Update!\n\nHi {{1}}! 👋\n\nYour trip booking to *{{2}}* with Voibee Holidays is *{{3}}*! ✈️\n\n📅 *Travel Date:* {{4}}\n🔖 *Booking ID:* {{5}}\n\n{{6}}\n\n🔗 *View Your Booking:*\n{{7}}\n\nThank you for choosing Voibee Holidays! 💚\n\nFooter: Voibee Holidays | Explore. Experience. Enjoy.",
  },

  reminder: {
    variables: [
      { variable: "{{1}} Traveller name", sample: "Ananya" },
      { variable: "{{2}} Destination", sample: "Kashmir" },
      { variable: "{{3}} Time remaining", sample: "tomorrow" },
      { variable: "{{4}} Travel date", sample: "12 Nov 2026" },
      { variable: "{{5}} Reporting time", sample: "06:30 AM" },
      { variable: "{{6}} Reporting place", sample: "Kochi" },
      { variable: "{{7}} Trip details URL", sample: "https://voibee.com/traveler/bookings" },
    ],
    preview: "Header: 🧳 Your Trip is Coming Up!\n\nHey {{1}}! 👋\n\nYour adventure to {{2}} is {{3}}! 🌴✈️\n\n📅 Travel Date: {{4}}\n🕒 Reporting Time: {{5}}\n📍 Reporting Place: {{6}}\n\nGet ready for an amazing journey! Make sure your bags are packed, travel documents are ready, and you're all set to go. 🎒✨\n\n🔗 Trip Details:\n{{7}}\n\nWishing you a wonderful journey filled with unforgettable memories! 💚\n\nFooter: Voibee Holidays",
  },

  experience: {
    variables: [
      { variable: "{{1}} Traveller name", sample: "Ananya" },
      { variable: "{{2}} Destination", sample: "Kerala" },
      {
        variable: "{{3}} Feedback link",
        sample: "https://voibee.com/feedback",
      },
    ],
    preview: "Header: 💚 How Was Your Trip?\n\nHey {{1}}! 👋\n\nWelcome back! We hope your trip to {{2}} was filled with beautiful moments and unforgettable memories. 🌴✨\n\nIt was a pleasure having you travel with Voibee Holidays!\n\nWe'd love to hear about your experience.\n\n⭐ Share Your Experience:\n{{3}}\n\nThank you for choosing us. Until your next adventure! ✈️💚\n\nFooter: Voibee Holidays",
  },
};

function normalize(item: InputCredential): Credential { return { ...blank, ...item, templates: { ...blankTemplates, ...item.templates } }; }

function TemplateInfo({ template }: { template: keyof WabisTemplates }) {
  const [open, setOpen] = useState(false);
  const format = templateFormats[template];
  return <span className="inline-flex">
    <button type="button" aria-label={`Show ${template} template message format`} onClick={() => setOpen(true)} className="rounded-full p-0.5 text-muted-foreground hover:bg-secondary hover:text-foreground"><Info className="size-3.5" /></button>
    {open ? <div className="fixed inset-0 z-[110] grid place-items-center p-4">
      <button className="absolute inset-0 bg-black/50" aria-label="Close template message format" onClick={() => setOpen(false)} />
      <section role="dialog" aria-modal="true" aria-label={`${template} template message format`} className="relative z-10 w-full max-w-2xl rounded-2xl border bg-background p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4"><div><h3 className="text-lg font-bold">Template message format</h3><p className="mt-1 text-sm text-muted-foreground">Create this format in Wabis, then enter its template name here.</p></div><Button type="button" variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close"><X /></Button></div>
        <div className="flex gap-4">
          <div className="mt-5 rounded-2xl bg-[#e8f5e9] p-4 text-sm leading-6 text-slate-800 shadow-sm"><p className="mb-2 text-xs font-semibold text-emerald-800">WhatsApp template preview</p><p className="whitespace-pre-wrap">{format.preview}</p></div>
          <div className="mt-5 w-xl"><p className="text-sm font-semibold">Required body variables</p><div className="mt-2 list-decimal space-y-1  text-sm text-muted-foreground">{format.variables.map((variable) => <div key={variable.variable} className="flex flex-col gap-2"><p>{variable.variable}</p><code className=" block break-all rounded-lg bg-secondary px-3 py-1 font-mono text-xs">{variable.sample}</code></div>)}</div></div>
        </div>
        <div className="mt-5 flex justify-end"><Button type="button" onClick={() => setOpen(false)}>Done</Button></div>
      </section>
    </div> : null}
  </span>;
}

export function IntegrationSettingsForm({ credentials, webhookUrl }: { credentials: InputCredential[]; webhookUrl: string }) {
  const [items, setItems] = useState(() => credentials.map(normalize));
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<Credential>(blank);
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const razorpay = draft.platform === "RAZORPAY_API"; const wabis = draft.platform === "WABIS_API"; const gemini = draft.platform === "GEMINI_AI";
  const edit = (index: number | "new") => { setDraft(index === "new" ? normalize(blank) : normalize(items[index])); setShowSecret(false); setEditing(index); };
  const persist = async (next: Credential[]) => { setSaving(true); try { const response = await fetch("/api/integrations", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credentials: next }) }); const body = await response.json(); if (!response.ok || !body.success) throw new Error(body.message || "Could not save integration"); setItems(body.data.credentials.map(normalize)); toast.success("Integration saved"); setEditing(null); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save integration"); } finally { setSaving(false); } };
  const save = () => { if (draft.alertEmail && !/^\S+@\S+\.\S+$/.test(draft.alertEmail)) return toast.error("Enter a valid payment alert email"); if (wabis && !draft.apikey.trim()) return toast.error("Wabis API key is required"); const next = wabis ? { ...draft, secretKey: "", url: "" } : draft; return persist(editing === "new" ? [...items, next] : items.map((item, index) => index === editing ? next : item)); };
  const remove = (index: number) => window.confirm(`Remove ${names[items[index].platform]}?`) && void persist(items.filter((_, current) => current !== index));

  return <div className="space-y-6"><Card><CardHeader className="flex-row justify-between"><div><CardTitle>Third-party integrations</CardTitle><p className="mt-1 text-sm text-muted-foreground">Connections and credentials for this agency only.</p></div><Button variant="gradient" onClick={() => edit("new")}><Plus className="size-4" />Add integration</Button></CardHeader><CardContent>{items.length ? <div className="divide-y rounded-xl border">{items.map((item, index) => <div key={`${item.platform}-${index}`} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-semibold">{names[item.platform]}</p><p className="text-sm text-muted-foreground">{item.name || "Not configured"}</p></div><div className="flex gap-2"><span className="flex items-center gap-1 text-xs text-emerald-700"><CheckCircle2 className="size-3.5" />Configured</span><Button variant="outline" size="sm" onClick={() => edit(index)}><Pencil className="size-4" />Edit</Button><Button variant="ghost" size="icon" aria-label="Remove integration" onClick={() => remove(index)}><Trash2 className="size-4" /></Button></div></div>)}</div> : <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No integrations added yet.</p>}</CardContent></Card>
    {editing !== null ? <div className="fixed inset-0 z-[90]"><button className="absolute inset-0 bg-black/45" onClick={() => !saving && setEditing(null)} aria-label="Close" /><aside className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col bg-background shadow-2xl"><header className="flex items-center justify-between border-b p-5"><div><h2 className="text-lg font-bold">{editing === "new" ? "Add integration" : `Edit ${names[draft.platform]}`}</h2><p className="text-sm text-muted-foreground">Enter credentials for this agency only.</p></div><Button variant="ghost" size="icon" onClick={() => setEditing(null)}><X /></Button></header><div className="flex-1 overflow-y-auto p-5"><div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><Label>Integration</Label><Select value={draft.platform} onChange={(event) => setDraft({ ...draft, platform: event.target.value as Platform })}><option value="CLOUDINARY">Cloudinary</option><option value="WABIS_API">Wabis API</option><option value="RAZORPAY_API">Razorpay API</option><option value="FLIGHT_API">Flight API</option><option value="GEMINI_AI">Gemini AI</option><option value="META_API">Meta API</option></Select></div>
      {wabis ? <><div><Label>Channel ID <span className="text-muted-foreground">(optional)</span></Label><Input placeholder="ch_123" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></div><div><Label>Wabis API key</Label><div className="relative"><Input type={showSecret ? "text" : "password"} value={draft.apikey} onChange={(event) => setDraft({ ...draft, apikey: event.target.value })} /><button type="button" className="absolute inset-y-0 right-0 px-3" onClick={() => setShowSecret(!showSecret)}>{showSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></div><div><Label>Language code</Label><Input placeholder="en" value={draft.languageCode} onChange={(event) => setDraft({ ...draft, languageCode: event.target.value })} /></div><p className="self-end text-xs text-muted-foreground">Wabis uses only the API key. No secret key is required.</p><div className="sm:col-span-2 rounded-xl border bg-secondary/20 p-4"><p className="font-semibold">Wabis template names</p><p className="mt-1 text-xs text-muted-foreground">Use the exact template names synced in your Wabis channel. Leave a template blank to skip that message type.</p><div className="mt-4 grid gap-4 sm:grid-cols-2">{templateLabels.map(([key, label, hint]) => <div key={key}><div className="flex items-center gap-1.5"><Label>{label}</Label><TemplateInfo template={key} /></div><Input className="mt-1" value={draft.templates[key]} onChange={(event) => setDraft({ ...draft, templates: { ...draft.templates, [key]: event.target.value } })} /><p className="mt-1 text-xs text-muted-foreground">{hint}</p></div>)}</div></div></> : <><div><Label>Account name</Label><Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></div><div><Label>API key</Label><Input type={gemini && !showSecret ? "password" : "text"} value={draft.apikey} onChange={(event) => setDraft({ ...draft, apikey: event.target.value })} /></div>{!gemini ? <><div><Label>Secret key</Label><div className="relative"><Input type={showSecret ? "text" : "password"} value={draft.secretKey} onChange={(event) => setDraft({ ...draft, secretKey: event.target.value })} /><button type="button" className="absolute inset-y-0 right-0 px-3" onClick={() => setShowSecret(!showSecret)}>{showSecret ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div></div><div><Label>Endpoint / optional URL</Label><Input value={draft.url} onChange={(event) => setDraft({ ...draft, url: event.target.value })} /></div></> : null}</>}
      {razorpay ? <><div className="sm:col-span-2 rounded-lg border bg-secondary/30 p-3"><Label>Razorpay webhook URL</Label><div className="mt-1 flex gap-2"><Input readOnly value={webhookUrl} className="font-mono text-xs" /><Button variant="outline" size="icon" onClick={() => { void navigator.clipboard.writeText(webhookUrl); toast.success("Webhook URL copied"); }}><Copy className="size-4" /></Button></div><p className="mt-2 text-xs text-muted-foreground">Add this URL in Razorpay Dashboard → Webhooks. Enable payment.captured and payment.failed.</p></div><div><Label>Webhook secret</Label><Input type={showSecret ? "text" : "password"} value={draft.webhookSecret} onChange={(event) => setDraft({ ...draft, webhookSecret: event.target.value })} /></div><div><Label>Payment alert email</Label><Input type="email" placeholder="payments@youragency.com" value={draft.alertEmail} onChange={(event) => setDraft({ ...draft, alertEmail: event.target.value })} /></div></> : null}</div></div><footer className="flex justify-end gap-3 border-t p-4"><Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button><Button variant="gradient" disabled={saving} onClick={() => void save()}>{saving ? <Loader2 className="size-4 animate-spin" /> : null}Save integration</Button></footer></aside></div> : null}</div>;
}

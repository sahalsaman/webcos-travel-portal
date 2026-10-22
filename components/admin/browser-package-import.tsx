"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, FileUp, Loader2, ScanText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { CloudinaryImageUrlsField } from "@/components/admin/cloudinary-image-urls-field";
import { CLIMATE_OPTIONS, COUNTRY_OPTIONS, PACKAGE_SERVICES, PACKAGE_TYPES, TRIP_CATEGORIES, tripThemeLabel, type PackageService } from "@/lib/constants";
import type { DestinationDTO } from "@/types";

type Draft = { title: string; destination: string; country: string; durationDays: number; basePrice: number; description: string; inclusions: string; exclusions: string; itinerary: string; pickupLocation: string; departureCities: string; category: string; packageType: string; climate: string; tags: string; images: string; includedServices: PackageService[]; fixedPrice: boolean; featured: boolean; };
const empty: Draft = { title: "", destination: "", country: "India", durationDays: 0, basePrice: 0, description: "", inclusions: "", exclusions: "", itinerary: "", pickupLocation: "", departureCities: "", category: "Holiday Package", packageType: "Standard", climate: "", tags: "", images: "", includedServices: [], fixedPrice: false, featured: false };

function lines(value: string) { return value.split("\n").map((line) => line.replace(/^[•\-–\d.\s]+/, "").trim()).filter(Boolean); }
function mapText(raw: string): Draft {
  const text = raw.replace(/\r/g, "");
  const rows = lines(text);
  const price = text.match(/(?:₹|INR|Rs\.?)[\s:]*([\d,]+)/i)?.[1];
  const days = text.match(/(\d+)\s*days?/i)?.[1];
  const section = (name: string) => { const index = rows.findIndex((row) => row.toLowerCase().includes(name)); return index < 0 ? [] : rows.slice(index + 1, index + 8).filter((row) => !/^(day\s*\d+|inclusions?|exclusions?|price|terms)/i.test(row)); };
  const daysList = rows.filter((row) => /^day\s*\d+/i.test(row));
  return { ...empty, title: rows.find((row) => row.length > 5 && row.length < 100 && !/^(day|inclusion|exclusion|price)/i.test(row)) ?? "", durationDays: Number(days ?? 0), basePrice: Number((price ?? "0").replaceAll(",", "")), description: rows.slice(0, 8).join(" ").slice(0, 1200), inclusions: section("inclusion").join("\n"), exclusions: section("exclusion").join("\n"), itinerary: daysList.join("\n") };
}

async function readFile(file: File, onProgress: (message: string) => void) {
  if (file.type === "application/pdf") {
    onProgress("Reading PDF text…");
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    let text = "";
    for (let pageNumber = 1; pageNumber <= Math.min(pdf.numPages, 10); pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      text += `\n${content.items.map((item) => "str" in item ? item.str : "").join(" ")}`;
    }
    if (text.trim().length > 40) return text;
    onProgress("Scanned PDF detected. Preparing images…");
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= Math.min(pdf.numPages, 5); pageNumber += 1) {
      const page = await pdf.getPage(pageNumber); const viewport = page.getViewport({ scale: 1.6 });
      const canvas = document.createElement("canvas"); canvas.width = viewport.width; canvas.height = viewport.height;
      await page.render({ canvas, canvasContext: canvas.getContext("2d")!, viewport }).promise; pages.push(canvas.toDataURL("image/png"));
    }
    return recognizeImages(pages, onProgress);
  }
  return recognizeImages([URL.createObjectURL(file)], onProgress);
}

async function recognizeImages(images: string[], onProgress: (message: string) => void) {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  let output = "";
  for (let index = 0; index < images.length; index += 1) { onProgress(`Reading image ${index + 1} of ${images.length}…`); output += `\n${(await worker.recognize(images[index])).data.text}`; }
  await worker.terminate();
  return output;
}

export function BrowserPackageImport({ destinations }: { destinations: DestinationDTO[] }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => current ? { ...current, [key]: value } : current);
  const missing = draft ? [!draft.title && "title", !draft.destination && "destination", !draft.country && "country", !draft.durationDays && "duration", !draft.basePrice && "price"].filter(Boolean) : [];
  const countryDestinations = draft ? destinations.filter((destination) => destination.country === draft.country) : [];

  function selectCountry(country: string) {
    const available = destinations.filter((destination) => destination.country === country);
    setDraft((current) => current ? { ...current, country, destination: available.some((destination) => destination.title === current.destination) ? current.destination : "" } : current);
  }

  function selectDestination(destinationTitle: string) {
    const destination = destinations.find((item) => item.title === destinationTitle);
    setDraft((current) => current ? { ...current, destination: destinationTitle, country: destination?.country ?? current.country } : current);
  }

  function toggleService(service: PackageService) {
    setDraft((current) => current ? { ...current, includedServices: current.includedServices.includes(service) ? current.includedServices.filter((item) => item !== service) : [...current.includedServices, service] } : current);
  }

  async function extract() { if (!file) return; setProgress("Preparing document…"); try { const text = await readFile(file, setProgress); if (!text.trim()) throw new Error("No readable text was found"); setDraft(mapText(text)); toast.success("Draft extracted. Review all fields before saving."); } catch (error) { toast.error((error as Error).message); } finally { setProgress(""); } }
  async function save(status: "draft" | "active") { if (!draft || missing.length) return; setSaving(true); const startDate = new Date().toISOString().slice(0, 10); const end = new Date(`${startDate}T00:00:00Z`); end.setUTCDate(end.getUTCDate() + draft.durationDays - 1); const itinerary = lines(draft.itinerary).map((title, index) => ({ day: index + 1, title, description: "", specials: [], highlights: [], schedule: [], transports: [], hotels: [], meals: [], sightseeing: [], activity: [] })); try { const response = await fetch("/api/packages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...draft, inclusions: lines(draft.inclusions), exclusions: lines(draft.exclusions), images: lines(draft.images), tags: draft.tags.split(",").map((tag) => tag.trim()).filter(Boolean), departureCities: lines(draft.departureCities), itinerary, startDate, endDate: end.toISOString().slice(0, 10), status, holidayPackage: true, supplierPackage: false, totalSeats: 999, availableSeats: 999, visaRequired: false, visaNote: "", visaDocuments: [], visaFee: 0, permitRequired: false, permitNote: "", permitDocuments: [], permitFee: 0 }) }); const result = await response.json(); if (!response.ok || !result.success) throw new Error(result.message || "Could not save package"); router.push("/admin/inventory/packages"); router.refresh(); } catch (error) { toast.error((error as Error).message); } finally { setSaving(false); } }
  if (!draft) return <div className="mx-auto max-w-3xl space-y-6"><div><p className="text-sm font-semibold text-primary">Browser OCR</p><h1 className="mt-1 text-2xl font-bold">Add package from PDF or image</h1><p className="mt-2 text-muted-foreground">The document is read in this browser. It is not uploaded to a separate OCR server.</p></div><Card><CardContent className="p-6"><label className="grid cursor-pointer place-items-center gap-3 rounded-2xl border-2 border-dashed border-primary/25 bg-primary/5 px-6 py-12 text-center"><FileUp className="size-9 text-primary" /><span className="font-semibold">Choose a PDF, JPG or PNG</span><span className="text-sm text-muted-foreground">PDF: first 10 text pages or 5 scanned pages</span><input className="sr-only" type="file" accept="application/pdf,image/jpeg,image/png" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label>{file ? <p className="mt-4 rounded-lg bg-secondary p-3 text-sm font-medium">{file.name}</p> : null}<Button className="mt-5 w-full" size="lg" disabled={!file || Boolean(progress)} onClick={() => void extract()}>{progress ? <Loader2 className="size-4 animate-spin" /> : <ScanText className="size-4" />}{progress || "Extract package details"}</Button></CardContent></Card></div>;
  return <div className="mx-auto max-w-4xl space-y-6">
    <div><p className="text-sm font-semibold text-primary">Browser OCR</p><h1 className="mt-1 text-2xl font-bold">Review extracted package</h1><p className="mt-2 text-muted-foreground">Correct the text before saving. OCR results can be incomplete.</p></div>
    {missing.length ? <div className="flex gap-2 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><AlertCircle className="size-5 shrink-0" />Missing: {missing.join(", ")}</div> : null}
    <Card><CardHeader><CardTitle>Package details</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
      <Field label="Title" value={draft.title} onChange={(value) => set("title", value)} />
      <div><Label className="mb-1.5 block">Country</Label><Select value={draft.country} onChange={(event) => selectCountry(event.target.value)}>{!COUNTRY_OPTIONS.some((country) => country.name === draft.country) ? <option value={draft.country}>{draft.country}</option> : null}{COUNTRY_OPTIONS.map((country) => <option key={country.code} value={country.name}>{country.name}</option>)}</Select></div>
      <div><Label className="mb-1.5 block">Destination</Label><Select value={draft.destination} onChange={(event) => selectDestination(event.target.value)} required><option value="">Select destination</option>{countryDestinations.map((destination) => <option key={destination._id} value={destination.title}>{destination.title}{destination.status === "inactive" ? " (Inactive)" : ""}</option>)}</Select>{!countryDestinations.length ? <p className="mt-1 text-xs text-muted-foreground">No destinations are set up for this country.</p> : null}</div>
      <Field label="Duration (days)" type="number" value={String(draft.durationDays || "")} onChange={(value) => set("durationDays", Number(value))} />
      <Field label="Price (INR)" type="number" value={String(draft.basePrice || "")} onChange={(value) => set("basePrice", Number(value))} />
      <Field label="Pickup location" value={draft.pickupLocation} onChange={(value) => set("pickupLocation", value)} />
      <div><Label className="mb-1.5 block">Package theme</Label><Select value={draft.category} onChange={(event) => set("category", event.target.value)}>{TRIP_CATEGORIES.map((category) => <option key={category} value={category}>{tripThemeLabel(category)}</option>)}</Select></div>
      <div><Label className="mb-1.5 block">Package category</Label><Select value={draft.packageType} onChange={(event) => set("packageType", event.target.value)}>{PACKAGE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</Select></div>
      <div><Label className="mb-1.5 block">Climate</Label><Select value={draft.climate} onChange={(event) => set("climate", event.target.value)}><option value="">Select climate</option>{CLIMATE_OPTIONS.map((climate) => <option key={climate} value={climate}>{climate}</option>)}</Select></div>
      <Field label="Tags (comma separated)" value={draft.tags} onChange={(value) => set("tags", value)} />
      <Area label="Description" className="sm:col-span-2" value={draft.description} onChange={(value) => set("description", value)} />
      <CloudinaryImageUrlsField value={draft.images} onChange={(value) => set("images", value)} />
      <Area label="Departure cities — one per line" value={draft.departureCities} onChange={(value) => set("departureCities", value)} />
      <Area label="Inclusions — one per line" value={draft.inclusions} onChange={(value) => set("inclusions", value)} />
      <Area label="Exclusions — one per line" value={draft.exclusions} onChange={(value) => set("exclusions", value)} />
      <Area label="Itinerary — one day per line" className="sm:col-span-2" value={draft.itinerary} onChange={(value) => set("itinerary", value)} />
      <div className="sm:col-span-2"><Label className="mb-2 block">Included services</Label><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{PACKAGE_SERVICES.map((service) => <label key={service} className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm has-checked:border-primary/40 has-checked:bg-primary/5"><input type="checkbox" checked={draft.includedServices.includes(service)} onChange={() => toggleService(service)} />{service}</label>)}</div></div>
      <div className="flex flex-wrap gap-5 sm:col-span-2"><label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={draft.fixedPrice} onChange={(event) => set("fixedPrice", event.target.checked)} />Fixed price</label><label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={draft.featured} onChange={(event) => set("featured", event.target.checked)} />Featured package</label></div>
    </CardContent></Card>
    <div className="flex justify-end gap-3"><Button variant="outline" disabled={saving || Boolean(missing.length)} onClick={() => void save("draft")}>Save as draft</Button><Button disabled={saving || Boolean(missing.length)} onClick={() => void save("active")}>{saving ? <Loader2 className="size-4 animate-spin" /> : null}Publish package</Button></div>
  </div>;
}
function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <div><Label className="mb-1.5 block">{label}</Label><Input type={type} value={value} onChange={(event) => onChange(event.target.value)} /></div>; }
function Area({ label, value, onChange, className }: { label: string; value: string; onChange: (value: string) => void; className?: string }) { return <div className={className}><Label className="mb-1.5 block">{label}</Label><Textarea rows={4} value={value} onChange={(event) => onChange(event.target.value)} /></div>; }

"use client";

import { useRef, useState } from "react";
import { Check, ImagePlus, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function CloudinaryImageUrlsField({ value, onChange, className }: { value: string; onChange: (value: string) => void; className?: string }) {
  const images = value.split("\n").map((item) => item.trim()).filter(Boolean);
  return <CloudinaryImageGallery className={className} images={images} onChange={(next) => onChange(next.join("\n"))} />;
}

export function CloudinaryImageGallery({ images, onChange, className, label = "Package images", description = "Choose previously uploaded images or add new ones to this vendor’s Cloudinary folder.", multiple = true, replaceLabel = "Change image" }: { images: string[]; onChange: (images: string[]) => void; className?: string; label?: string; description?: string; multiple?: boolean; replaceLabel?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [library, setLibrary] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function openPicker() {
    setPickerOpen(true); setSelected([]); setLibrary([]); setNextCursor(null); setLoadingLibrary(true);
    try {
      const response = await fetch("/api/admin/uploads/cloudinary/library", { cache: "no-store" }); const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Could not load image library");
      setLibrary(result.data.images); setNextCursor(result.data.nextCursor ?? null);
    } catch (error) { toast.error((error as Error).message); } finally { setLoadingLibrary(false); }
  }
  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const response = await fetch(`/api/admin/uploads/cloudinary/library?cursor=${encodeURIComponent(nextCursor)}`, { cache: "no-store" }); const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Could not load more images");
      setLibrary((current) => [...new Set([...current, ...result.data.images])]); setNextCursor(result.data.nextCursor ?? null);
    } catch (error) { toast.error((error as Error).message); } finally { setLoadingMore(false); }
  }
  function choose(url: string) { setSelected((current) => multiple ? current.includes(url) ? current.filter((item) => item !== url) : [...current, url] : [url]); }
  function addSelected() { if (!selected.length) return; onChange(multiple ? [...new Set([...images, ...selected])] : [selected[0]]); setPickerOpen(false); }
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const picked = Array.from(files);
    if (picked.some((file) => file.size > 2 * 1024 * 1024)) { toast.error("Each image must be 2 MB or smaller"); return; }
    setUploading(true);
    try {
      const urls = await Promise.all(picked.map(async (file) => { const body = new FormData(); body.set("file", file); const response = await fetch("/api/admin/uploads/cloudinary", { method: "POST", body }); const result = await response.json(); if (!response.ok || !result.success) throw new Error(result.message || `Could not upload ${file.name}`); return result.data.url as string; }));
      setLibrary((current) => [...urls, ...current.filter((url) => !urls.includes(url))]);
      setSelected(multiple ? (current) => [...new Set([...current, ...urls])] : [urls[0]]);
      toast.success(`${urls.length} image${urls.length === 1 ? "" : "s"} uploaded`);
    } catch (error) { toast.error((error as Error).message); } finally { setUploading(false); if (input.current) input.current.value = ""; }
  }

  return <div className={className}><div className="mb-3"><Label>{label}</Label><p className="mt-1 text-xs text-muted-foreground">{description}</p></div><div className={images.length ? "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" : "flex justify-start"}>{images.map((url, index) => <div key={`${url}-${index}`} className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-secondary" style={{ backgroundImage: `url(${JSON.stringify(url)})`, backgroundPosition: "center", backgroundSize: "cover" }}><Button type="button" variant="destructive" size="icon" className="absolute right-2 top-2 size-8 opacity-100 sm:opacity-0 sm:group-hover:opacity-100" aria-label="Remove image" onClick={() => onChange(images.filter((_, imageIndex) => imageIndex !== index))}><X className="size-3.5" /></Button></div>)}{(multiple || !images.length) ? <button type="button" className="flex aspect-[4/3] min-h-28 min-w-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-primary/45 bg-primary/5 px-3 text-center text-xs font-semibold text-primary transition-colors hover:bg-primary/10" onClick={() => void openPicker()}><ImagePlus className="size-5" />Choose image</button> : <button type="button" className="flex aspect-[4/3] min-h-28 min-w-32 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-primary/45 bg-primary/5 px-3 text-center text-xs font-semibold text-primary transition-colors hover:bg-primary/10" onClick={() => void openPicker()}><ImagePlus className="size-5" />{replaceLabel}</button>}</div>
    {pickerOpen ? <div className="fixed inset-0 z-[100]"><button type="button" className="absolute inset-0 bg-black/50" onClick={() => setPickerOpen(false)} aria-label="Close image picker" /><div role="dialog" aria-modal="true" aria-labelledby="image-picker-title" className="absolute left-1/2 top-1/2 flex max-h-[85vh] w-[min(92vw,760px)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 id="image-picker-title" className="font-bold">Choose an image</h2><p className="text-sm text-muted-foreground">Latest 12 images in this vendor’s Cloudinary library.</p></div><Button type="button" variant="ghost" size="icon" onClick={() => setPickerOpen(false)} aria-label="Close"><X /></Button></div><div className="min-h-0 flex-1 overflow-y-auto p-5"><input ref={input} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple={multiple} onChange={(event) => void upload(event.target.files)} /><Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => input.current?.click()}>{uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}{uploading ? "Uploading…" : "Upload new image"}</Button><p className="mt-2 text-xs text-muted-foreground">JPG, PNG, WebP or AVIF · maximum 2 MB per image.</p>{loadingLibrary ? <div className="grid min-h-56 place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div> : library.length ? <><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">{library.map((url) => <button key={url} type="button" className={`group relative aspect-[4/3] overflow-hidden rounded-lg border-2 bg-secondary ${selected.includes(url) ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-primary/40"}`} onClick={() => choose(url)} style={{ backgroundImage: `url(${JSON.stringify(url)})`, backgroundPosition: "center", backgroundSize: "cover" }}>{selected.includes(url) ? <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="size-4" /></span> : null}</button>)}</div>{nextCursor ? <div className="mt-5 flex justify-center"><Button type="button" variant="outline" disabled={loadingMore} onClick={() => void loadMore()}>{loadingMore ? <Loader2 className="size-4 animate-spin" /> : null}{loadingMore ? "Loading…" : "Load more images"}</Button></div> : null}</> : <div className="mt-5 grid min-h-48 place-items-center rounded-xl border border-dashed text-sm text-muted-foreground">No Cloudinary images yet. Upload the first one.</div>}</div><div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4"><p className="text-sm text-muted-foreground">{selected.length ? `${selected.length} selected` : "Select an image to continue"}</p><div className="flex gap-2"><Button type="button" variant="outline" onClick={() => setPickerOpen(false)}>Cancel</Button><Button type="button" variant="gradient" disabled={!selected.length} onClick={addSelected}>Use selected image{selected.length === 1 ? "" : "s"}</Button></div></div></div></div> : null}
  </div>;
}

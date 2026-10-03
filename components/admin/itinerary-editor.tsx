"use client";

import { useState } from "react";
import { Binoculars, BusFront, ChevronDown, Clock3, Hotel, Plus, Sparkles, Trash2, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { InventoryAssetDTO, ItineraryHighlight, ItineraryItem } from "@/types";

export function emptyItineraryDay(day: number): ItineraryItem {
  return { day, title: "", description: "", specials: [], highlights: [], schedule: [], transports: [], hotels: [], meals: [], sightseeing: [], activity: [] };
}

export function normalizeItineraryDay(item: ItineraryItem, index: number): ItineraryItem {
  return {
    ...item,
    day: index + 1,
    specials: item.specials ?? [],
    highlights: item.highlights ?? [],
    schedule: item.schedule ?? [],
    transports: item.transports ?? [],
    hotels: item.hotels ?? [],
    meals: item.meals ?? [],
    sightseeing: item.sightseeing ?? [],
    activity: item.activity ?? [],
  };
}

export function ItineraryEditor({ value, onChange, hotels = [], vehicles = [] }: { value: ItineraryItem[]; onChange: (items: ItineraryItem[]) => void; hotels?: InventoryAssetDTO[]; vehicles?: InventoryAssetDTO[] }) {
  const [openDays, setOpenDays] = useState<Set<number>>(() => new Set([0]));
  const updateDay = (index: number, update: Partial<ItineraryItem>) => onChange(value.map((day, dayIndex) => dayIndex === index ? { ...day, ...update } : day));
  const removeDay = (index: number) => {
    onChange(value.filter((_, dayIndex) => dayIndex !== index).map(normalizeItineraryDay));
    setOpenDays((current) => new Set([...current].flatMap((dayIndex) => dayIndex === index ? [] : [dayIndex > index ? dayIndex - 1 : dayIndex])));
  };
  const addDay = () => {
    const nextIndex = value.length;
    onChange([...value, emptyItineraryDay(nextIndex + 1)]);
    setOpenDays((current) => new Set([...current, nextIndex]));
  };
  const toggleDay = (index: number) => setOpenDays((current) => {
    const next = new Set(current);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    return next;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><Label className="text-base">Detailed itinerary</Label><p className="mt-1 text-xs text-muted-foreground">Add everything included on each day.</p></div>
        <Button type="button" variant="outline" size="sm" onClick={addDay}><Plus /> Add day</Button>
      </div>

      {value.map((day, dayIndex) => (
        <section key={dayIndex} className="overflow-hidden rounded-xl border border-border bg-background">
          <div className="flex items-center gap-3 border-b bg-secondary/50 p-4">
            <button
              type="button"
              onClick={() => toggleDay(dayIndex)}
              aria-expanded={openDays.has(dayIndex)}
              aria-controls={`itinerary-day-${dayIndex}`}
              className="flex shrink-0 items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
            >
              Day {dayIndex + 1}
              <ChevronDown className={`size-4 transition-transform ${openDays.has(dayIndex) ? "rotate-180" : ""}`} />
            </button>
            <Input required value={day.title} onChange={(event) => updateDay(dayIndex, { title: event.target.value })} placeholder="Day title, e.g. Arrival in Zurich" className="bg-card" />
            <Button type="button" variant="ghost" size="icon" disabled={value.length === 1} onClick={() => removeDay(dayIndex)} aria-label={`Remove day ${dayIndex + 1}`}><Trash2 className="text-destructive" /></Button>
          </div>

          <div id={`itinerary-day-${dayIndex}`} hidden={!openDays.has(dayIndex)} className="space-y-5 p-4 sm:p-5">
            <div><Label className="mb-1.5 block">Day overview</Label><Textarea value={day.description} onChange={(event) => updateDay(dayIndex, { description: event.target.value })} placeholder="Short summary of the day" className="min-h-20" /></div>

            <SpecialChips value={day.specials ?? []} onChange={(specials) => updateDay(dayIndex, { specials })} />

            <DayHighlightImages value={day.highlights ?? []} onChange={(highlights) => updateDay(dayIndex, { highlights })} />

            <DayGroup icon={Hotel} title="Hotel" action="Add hotel" onAdd={() => updateDay(dayIndex, { hotels: [...(day.hotels ?? []), { hotel_id: "" }] })}>
              {(day.hotels ?? []).map((hotel, hotelIndex) => <ItemBox key={hotelIndex} onRemove={() => updateDay(dayIndex, { hotels: day.hotels?.filter((_, index) => index !== hotelIndex) })}><select required value={referenceId(hotel.hotel_id)} onChange={(event) => updateDay(dayIndex, { hotels: day.hotels?.map((item, index) => index === hotelIndex ? { hotel_id: event.target.value } : item) })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Select hotel</option>{hotels.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></ItemBox>)}
            </DayGroup>

            <DayGroup icon={BusFront} title="Transport" action="Add transport" onAdd={() => updateDay(dayIndex, { transports: [...(day.transports ?? []), { vehicle_id: "" }] })}>
              {(day.transports ?? []).map((transport, transportIndex) => <ItemBox key={transportIndex} onRemove={() => updateDay(dayIndex, { transports: day.transports?.filter((_, index) => index !== transportIndex) })}><select required value={referenceId(transport.vehicle_id)} onChange={(event) => updateDay(dayIndex, { transports: day.transports?.map((item, index) => index === transportIndex ? { vehicle_id: event.target.value } : item) })} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="">Select transport</option>{vehicles.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></ItemBox>)}
            </DayGroup>

            <div className="rounded-xl border border-border/70 bg-secondary/20 p-4"><div className="mb-3 flex items-center gap-2 font-semibold"><Utensils className="size-4 text-primary" />Meals</div><div className="flex flex-wrap gap-3">{(["breakfast", "lunch", "dinner"] as const).map((meal) => <label key={meal} className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-medium"><input type="checkbox" checked={(day.meals ?? []).includes(meal)} onChange={() => { const meals = day.meals ?? []; updateDay(dayIndex, { meals: meals.includes(meal) ? meals.filter((item) => item !== meal) : [...meals, meal] }); }} className="size-4 accent-[var(--primary)]" />{meal[0].toUpperCase() + meal.slice(1)}</label>)}</div></div>

            <DayGroup icon={Binoculars} title="Sightseeing" action="Add place" onAdd={() => updateDay(dayIndex, { sightseeing: [...(day.sightseeing ?? []), { name: "", description: "", image: "" }] })}>
              {(day.sightseeing ?? []).map((place, placeIndex) => (
                <ItemBox key={placeIndex} onRemove={() => updateDay(dayIndex, { sightseeing: day.sightseeing?.filter((_, index) => index !== placeIndex) })}>
                  <div className="grid gap-3 sm:grid-cols-2"><Input required value={place.name} onChange={(event) => updateDay(dayIndex, { sightseeing: day.sightseeing?.map((entry, index) => index === placeIndex ? { ...entry, name: event.target.value } : entry) })} placeholder="Place name" /><Input type="url" value={place.image} onChange={(event) => updateDay(dayIndex, { sightseeing: day.sightseeing?.map((entry, index) => index === placeIndex ? { ...entry, image: event.target.value } : entry) })} placeholder="Place photo URL" /></div>
                  <Textarea required value={place.description} onChange={(event) => updateDay(dayIndex, { sightseeing: day.sightseeing?.map((entry, index) => index === placeIndex ? { ...entry, description: event.target.value } : entry) })} placeholder="Short description of this sightseeing place" className="min-h-20" />
                </ItemBox>
              ))}
            </DayGroup>

            <DayGroup icon={Sparkles} title="Activities" action="Add activity" onAdd={() => updateDay(dayIndex, { activity: [...(day.activity ?? []), { name: "", description: "", image: "" }] })}>
              {(day.activity ?? []).map((place, placeIndex) => (
                <ItemBox key={placeIndex} onRemove={() => updateDay(dayIndex, { activity: day.activity?.filter((_, index) => index !== placeIndex) })}>
                  <div className="grid gap-3 sm:grid-cols-2"><Input required value={place.name} onChange={(event) => updateDay(dayIndex, { activity: day.activity?.map((entry, index) => index === placeIndex ? { ...entry, name: event.target.value } : entry) })} placeholder="Activity name" /><Input type="url" value={place.image} onChange={(event) => updateDay(dayIndex, { activity: day.activity?.map((entry, index) => index === placeIndex ? { ...entry, image: event.target.value } : entry) })} placeholder="Activity photo URL" /></div>
                  <Textarea required value={place.description} onChange={(event) => updateDay(dayIndex, { activity: day.activity?.map((entry, index) => index === placeIndex ? { ...entry, description: event.target.value } : entry) })} placeholder="Short description of this activity" className="min-h-20" />
                </ItemBox>
              ))}
            </DayGroup>

            <DayGroup icon={Clock3} title="Time-wise schedule" action="Add time" onAdd={() => updateDay(dayIndex, { schedule: [...(day.schedule ?? []), { time: "", title: "", description: "" }] })}>
              {(day.schedule ?? []).map((item, itemIndex) => (
                <ItemBox key={itemIndex} onRemove={() => updateDay(dayIndex, { schedule: day.schedule?.filter((_, index) => index !== itemIndex) })}>
                  <div className="grid gap-3 sm:grid-cols-[150px_1fr]"><Input type="time" required value={item.time} onChange={(event) => updateDay(dayIndex, { schedule: day.schedule?.map((entry, index) => index === itemIndex ? { ...entry, time: event.target.value } : entry) })} aria-label="Schedule time" /><Input required value={item.title} onChange={(event) => updateDay(dayIndex, { schedule: day.schedule?.map((entry, index) => index === itemIndex ? { ...entry, title: event.target.value } : entry) })} placeholder="Activity, e.g. Meet & greet" /></div>
                  <Textarea value={item.description} onChange={(event) => updateDay(dayIndex, { schedule: day.schedule?.map((entry, index) => index === itemIndex ? { ...entry, description: event.target.value } : entry) })} placeholder="What happens at this time?" className="min-h-16" />
                </ItemBox>
              ))}
            </DayGroup>
          </div>
        </section>
      ))}
    </div>
  );
}

function DayHighlightImages({ value, onChange }: { value: ItineraryHighlight[]; onChange: (highlights: ItineraryHighlight[]) => void }) {
  return <section className="rounded-xl border border-border/70 bg-secondary/20 p-4"><div className="mb-3 flex items-center justify-between gap-3"><div><p className="font-semibold">Highlight images</p><p className="text-xs text-muted-foreground">Add any images that show this day’s experience.</p></div><Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, { image: "" }])}><Plus />Add image</Button></div><div className="space-y-3">{value.map((highlight, index) => <div key={index} className="flex gap-3"><Input type="url" required value={highlight.image} onChange={(event) => onChange(value.map((item, itemIndex) => itemIndex === index ? { image: event.target.value } : item))} placeholder="Image URL" /><Button type="button" variant="ghost" size="icon" onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="size-4 text-destructive" /></Button></div>)}</div></section>;
}

function referenceId(value: unknown) {
  if (typeof value === "string") return value;
  return value && typeof value === "object" && "_id" in value && typeof value._id === "string" ? value._id : "";
}

function SpecialChips({ value, onChange }: { value: string[]; onChange: (items: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const add = () => { const item = draft.trim(); if (item && !value.includes(item)) onChange([...value, item]); setDraft(""); };
  return <section className="rounded-xl border border-border/70 bg-secondary/20 p-4"><Label className="mb-1.5 block">What&apos;s special?</Label><div className="flex flex-wrap gap-2">{value.map((item) => <span key={item} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">{item}<button type="button" onClick={() => onChange(value.filter((entry) => entry !== item))} aria-label={`Remove ${item}`} className="ml-1 text-primary/70 hover:text-primary">×</button></span>)}</div><div className="mt-3 flex gap-2"><Input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); add(); } }} placeholder="e.g. Sunrise viewpoint" /><Button type="button" variant="outline" onClick={add}>Add</Button></div></section>;
}

function DayGroup({ icon: Icon, title, action, onAdd, children }: { icon: typeof BusFront; title: string; action: string; onAdd: () => void; children: React.ReactNode }) {
  return <div className="rounded-xl border border-border/70 bg-secondary/20 p-4"><div className="mb-3 flex items-center justify-between gap-3"><div className="flex items-center gap-2 font-semibold"><Icon className="size-4 text-primary" /> {title}</div><Button type="button" variant="outline" size="sm" onClick={onAdd}><Plus /> {action}</Button></div><div className="space-y-3">{children}</div></div>;
}

function ItemBox({ onRemove, children }: { onRemove: () => void; children: React.ReactNode }) {
  return <div className="relative space-y-3 rounded-lg border border-border bg-card p-3 pr-12 shadow-sm">{children}<Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1" onClick={onRemove} aria-label="Remove item"><Trash2 className="size-4 text-destructive" /></Button></div>;
}

"use client";

import { useState } from "react";
import { Binoculars, BusFront, ChevronDown, Hotel, Plus, Trash2, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ItineraryItem, ItineraryMeal } from "@/types";

const MEALS: Array<{ value: ItineraryMeal; label: string }> = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
];

export function emptyItineraryDay(day: number): ItineraryItem {
  return { day, title: "", description: "", transports: [], hotels: [], meals: [], sightseeing: [] };
}

export function normalizeItineraryDay(item: ItineraryItem, index: number): ItineraryItem {
  return {
    ...item,
    day: index + 1,
    transports: item.transports ?? [],
    hotels: item.hotels ?? [],
    meals: item.meals ?? [],
    sightseeing: item.sightseeing ?? [],
  };
}

export function ItineraryEditor({ value, onChange }: { value: ItineraryItem[]; onChange: (items: ItineraryItem[]) => void }) {
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

            <DayGroup icon={BusFront} title="Transport" action="Add transport" onAdd={() => updateDay(dayIndex, { transports: [...(day.transports ?? []), { title: "", description: "" }] })}>
              {(day.transports ?? []).map((item, itemIndex) => (
                <ItemBox key={itemIndex} onRemove={() => updateDay(dayIndex, { transports: day.transports?.filter((_, index) => index !== itemIndex) })}>
                  <Input required value={item.title} onChange={(event) => updateDay(dayIndex, { transports: day.transports?.map((entry, index) => index === itemIndex ? { ...entry, title: event.target.value } : entry) })} placeholder="Transport title, e.g. Airport transfer" />
                  <Textarea value={item.description} onChange={(event) => updateDay(dayIndex, { transports: day.transports?.map((entry, index) => index === itemIndex ? { ...entry, description: event.target.value } : entry) })} placeholder="Pickup, route, vehicle and timing details" className="min-h-16" />
                </ItemBox>
              ))}
            </DayGroup>

            <DayGroup icon={Hotel} title="Hotels" action="Add hotel" onAdd={() => updateDay(dayIndex, { hotels: [...(day.hotels ?? []), { name: "", description: "", image: "", verified: true }] })}>
              {(day.hotels ?? []).map((item, itemIndex) => (
                <ItemBox key={itemIndex} onRemove={() => updateDay(dayIndex, { hotels: day.hotels?.filter((_, index) => index !== itemIndex) })}>
                  <div className="grid gap-3 sm:grid-cols-2"><Input required value={item.name} onChange={(event) => updateDay(dayIndex, { hotels: day.hotels?.map((entry, index) => index === itemIndex ? { ...entry, name: event.target.value } : entry) })} placeholder="Hotel name" /><Input type="url" value={item.image} onChange={(event) => updateDay(dayIndex, { hotels: day.hotels?.map((entry, index) => index === itemIndex ? { ...entry, image: event.target.value } : entry) })} placeholder="Hotel photo URL" /></div>
                  <Textarea value={item.description} onChange={(event) => updateDay(dayIndex, { hotels: day.hotels?.map((entry, index) => index === itemIndex ? { ...entry, description: event.target.value } : entry) })} placeholder="Room, category or check-in details" className="min-h-16" />
                  <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={item.verified !== false} onChange={(event) => updateDay(dayIndex, { hotels: day.hotels?.map((entry, index) => index === itemIndex ? { ...entry, verified: event.target.checked } : entry) })} className="size-4 accent-primary" />Agency verified property</label>
                </ItemBox>
              ))}
            </DayGroup>

            <div className="rounded-xl border border-border/70 bg-secondary/20 p-4">
              <div className="mb-3 flex items-center gap-2 font-semibold"><Utensils className="size-4 text-primary" /> Meals</div>
              <div className="flex flex-wrap gap-2">{MEALS.map((meal) => <label key={meal.value} className="flex cursor-pointer items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-medium"><input type="checkbox" checked={(day.meals ?? []).includes(meal.value)} onChange={() => { const meals = day.meals ?? []; updateDay(dayIndex, { meals: meals.includes(meal.value) ? meals.filter((item) => item !== meal.value) : [...meals, meal.value] }); }} className="size-4 accent-[var(--primary)]" />{meal.label}</label>)}</div>
            </div>

            <DayGroup icon={Binoculars} title="Sightseeing" action="Add place" onAdd={() => updateDay(dayIndex, { sightseeing: [...(day.sightseeing ?? []), { name: "", description: "", image: "" }] })}>
              {(day.sightseeing ?? []).map((place, placeIndex) => (
                <ItemBox key={placeIndex} onRemove={() => updateDay(dayIndex, { sightseeing: day.sightseeing?.filter((_, index) => index !== placeIndex) })}>
                  <div className="grid gap-3 sm:grid-cols-2"><Input required value={place.name} onChange={(event) => updateDay(dayIndex, { sightseeing: day.sightseeing?.map((entry, index) => index === placeIndex ? { ...entry, name: event.target.value } : entry) })} placeholder="Place name" /><Input type="url" value={place.image} onChange={(event) => updateDay(dayIndex, { sightseeing: day.sightseeing?.map((entry, index) => index === placeIndex ? { ...entry, image: event.target.value } : entry) })} placeholder="Place photo URL" /></div>
                  <Textarea required value={place.description} onChange={(event) => updateDay(dayIndex, { sightseeing: day.sightseeing?.map((entry, index) => index === placeIndex ? { ...entry, description: event.target.value } : entry) })} placeholder="Short description of this sightseeing place" className="min-h-20" />
                </ItemBox>
              ))}
            </DayGroup>
          </div>
        </section>
      ))}
    </div>
  );
}

function DayGroup({ icon: Icon, title, action, onAdd, children }: { icon: typeof BusFront; title: string; action: string; onAdd: () => void; children: React.ReactNode }) {
  return <div className="rounded-xl border border-border/70 bg-secondary/20 p-4"><div className="mb-3 flex items-center justify-between gap-3"><div className="flex items-center gap-2 font-semibold"><Icon className="size-4 text-primary" /> {title}</div><Button type="button" variant="outline" size="sm" onClick={onAdd}><Plus /> {action}</Button></div><div className="space-y-3">{children}</div></div>;
}

function ItemBox({ onRemove, children }: { onRemove: () => void; children: React.ReactNode }) {
  return <div className="relative space-y-3 rounded-lg border border-border bg-card p-3 pr-12 shadow-sm">{children}<Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1" onClick={onRemove} aria-label="Remove item"><Trash2 className="size-4 text-destructive" /></Button></div>;
}

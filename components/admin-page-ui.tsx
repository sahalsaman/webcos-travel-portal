import { Loader2 } from "lucide-react";

export function Status({ value }: { value: string }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${value === "active" || value === "resolved" ? "bg-emerald-100 text-emerald-700" : value === "suspended" || value === "past_due" || value === "urgent" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>{value.replaceAll("_", " ")}</span>;
}

export function Loading() { return <div className="grid min-h-64 place-items-center"><Loader2 className="size-6 animate-spin text-primary" /></div>; }
export function ErrorState({ message }: { message: string }) { return <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">{message}</div>; }

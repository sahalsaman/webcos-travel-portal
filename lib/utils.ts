import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names, resolving conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Preserve the selected storefront country while navigating between pages. */
export function withCountryParam(path: string, country?: string) {
  const code = country?.trim().toUpperCase();
  return code ? `${path}${path.includes("?") ? "&" : "?"}c=${encodeURIComponent(code)}` : path;
}

/** Format a number as Indian Rupees (no decimals by default). */
export function formatINR(amount: number, opts?: { decimals?: boolean }) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: opts?.decimals ? 2 : 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

/** Format money using the visitor country. */
export function formatCurrencyForCountry(amount: number, countryCode?: string, opts?: { decimals?: boolean }) {
  const isIndia = (countryCode ?? "IN").toUpperCase() === "IN";

  return new Intl.NumberFormat(isIndia ? "en-IN" : "en-US", {
    style: "currency",
    currency: isIndia ? "INR" : "USD",
    maximumFractionDigits: opts?.decimals ? 2 : 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

/** Compact number, e.g. 12500 -> 12.5K. */
export function formatCompact(n: number) {
  return new Intl.NumberFormat("en-IN", { notation: "compact" }).format(n || 0);
}

/** Format a date as e.g. "12 Jul 2026". */
export function formatDate(date: Date | string | number) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Inclusive day count between two dates: "5D / 4N" friendly. */
export function tripDuration(start: Date | string, end: Date | string, configuredDays?: number) {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  const dateDays = Math.max(1, Math.round((e - s) / 86_400_000) + 1);
  const days = configuredDays && configuredDays > 0 ? Math.round(configuredDays) : dateDays;
  const nights = Math.max(0, days - 1);
  return { days, nights, label: `${days}D / ${nights}N` };
}

/** URL-safe slug from arbitrary text. */
export function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Keep links stored before the public trips route was renamed working. */
export function normalizePackageHref(href?: string) {
  const value = href?.trim() || "/packages";
  return value.replace(/^\/trips(?=\/|\?|#|$)/, "/packages");
}

/** Short, human-friendly unique-ish id (for booking numbers etc). */
export function shortId(prefix = "") {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const time = Date.now().toString(36).slice(-4).toUpperCase();
  return `${prefix}${time}${rand}`;
}

/** Clamp a number. */
export function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

/** Make a plain JS object from a Mongoose doc / nested ObjectIds & Dates. */
export function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

/** Build the absolute URL for a white-label partner trip link. */
export function whiteLabelUrl(partnerSlug: string, tripSlug: string, siteUrl?: string) {
  const base = siteUrl || "";
  return `${base}/p/${partnerSlug}/${tripSlug}`;
}

import { fail, handleError, ok, requireApiRole } from "@/lib/api";
import { CLIMATE_OPTIONS, PACKAGE_SERVICES, type PackageService } from "@/lib/constants";
import { getBusinessCredentials } from "@/lib/business";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const supportedTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
const UNSPLASH_IMAGES = {
  kashmir: "https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=1600&q=85",
  srinagar: "https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=1600&q=85",
  goa: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1600&q=85",
  ladakh: "https://images.unsplash.com/photo-1593181629936-11c609b8db9b?auto=format&fit=crop&w=1600&q=85",
  kerala: "https://images.unsplash.com/photo-1602303315526-18f8f7c2a4e0?auto=format&fit=crop&w=1600&q=85",
  dubai: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=85",
  paris: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1600&q=85",
  singapore: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1600&q=85",
  thailand: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=85",
  maldives: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1600&q=85",
  default: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=85",
} as const;

function string(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function number(value: unknown) { const parsed = Number(String(value ?? "").replace(/[^0-9.]/g, "")); return Number.isFinite(parsed) ? parsed : 0; }
function list(value: unknown) { return Array.isArray(value) ? value.map(string).filter(Boolean) : []; }
function climate(value: unknown) {
  const raw = string(value).toLowerCase();
  if ((CLIMATE_OPTIONS as readonly string[]).some((item) => item.toLowerCase() === raw)) return string(value);
  if (/monsoon|rain/.test(raw)) return "Rainy / Monsoon";
  if (/tropic|humid/.test(raw)) return "Tropical";
  if (/cold|snow|winter/.test(raw)) return "Cold";
  if (/cool|hill|mountain/.test(raw)) return "Cool";
  if (/dry|desert/.test(raw)) return "Dry";
  if (/warm|hot|summer/.test(raw)) return "Warm";
  if (/mild|temperate|pleasant/.test(raw)) return "Moderate";
  return "";
}
function packageImage(searchable: string) {
  const key = (Object.keys(UNSPLASH_IMAGES).filter((item) => item !== "default") as Array<keyof typeof UNSPLASH_IMAGES>).find((item) => searchable.includes(item));
  return [UNSPLASH_IMAGES[key ?? "default"]];
}
function suggestionList(value: unknown) { return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object").map((item) => ({ name: string(item.name) || string(item.title), description: string(item.description), location: string(item.location) || string(item.destination) })).filter((item) => item.name) : []; }
function services(value: unknown): PackageService[] {
  const aliases: Record<string, PackageService> = {
    flight: "flights", flights: "flights", hotel: "hotels", hotels: "hotels", "tour manager": "tour-manager", transport: "transportation", "ac transportation": "ac-premium-transportation", insurance: "travel-insurance", activity: "activities", activities: "activities", "welcome drink": "welcome-drink", water: "drinking-water", "first aid": "first-aid", "luggage assistance": "luggage-assistance",
  };
  return Array.from(new Set(list(value).map((item) => item.toLowerCase().replace(/[_-]/g, " ").replace(/\s+/g, " ").trim()).map((item) => aliases[item] ?? item.replace(/\s+/g, "-") as PackageService).filter((item): item is PackageService => (PACKAGE_SERVICES as readonly string[]).includes(item))));
}

function normalize(data: Record<string, unknown>) {
  const destinations = suggestionList(data.destinations);
  const itinerary = list(data.itinerary);
  const destination = string(data.destination) || string(data.location) || destinations[0]?.location || destinations[0]?.name || "";
  const durationDays = number(data.durationDays ?? data.duration ?? data.days) || itinerary.length || 1;
  return {
    title: string(data.title) || string(data.packageName) || (destination ? `${destination} Getaway` : ""), destination, country: string(data.country) || "India",
    durationDays, basePrice: number(data.basePrice ?? data.price ?? data.sellingPrice), description: string(data.description),
    inclusions: list(data.inclusions), exclusions: list(data.exclusions), itinerary,
    pickupLocation: string(data.pickupLocation), departureCities: list(data.departureCities), category: string(data.category) || "Holiday Package",
    packageType: string(data.packageType) || "Standard", climate: climate(data.climate), tags: list(data.tags),
    images: packageImage(`${string(data.title)} ${destination} ${string(data.country)}`.toLowerCase()), includedServices: services(data.includedServices), fixedPrice: Boolean(data.fixedPrice), featured: Boolean(data.featured),
    suggestions: { destinations, hotels: suggestionList(data.hotels), transportation: suggestionList(data.transportation), activities: suggestionList(data.activities) },
  };
}

export async function POST(request: Request) {
  try {
    await requireApiRole(["admin"]);
    const gemini = (await getBusinessCredentials()).find((credential) => credential.platform === "GEMINI_AI");
    const key = gemini?.apikey?.trim();
    if (!key) return fail("Add your Gemini AI API key in Settings → Integrations before generating a package", 503);
    const form = await request.formData();
    const file = form.get("file");
    const promptInput = form.get("prompt");
    const promptValue = typeof promptInput === "string" ? promptInput.trim() : "";
    if (!promptValue && !(file instanceof File)) return fail("Write a package request or attach a PDF or image", 422);
    if (file instanceof File && !supportedTypes.has(file.type)) return fail("Use a PDF, JPG, PNG, or WebP file", 422);
    if (file instanceof File && (!file.size || file.size > MAX_FILE_SIZE)) return fail("The file must be 10 MB or smaller", 422);

    const prompt = `Create one detailed travel package from the user's request and/or attached source file. Return ONLY valid JSON with this exact shape:
{"title":"","destination":"","country":"","durationDays":0,"basePrice":0,"description":"","images":[""],"inclusions":[""],"exclusions":[""],"itinerary":["Day 1: ..."],"pickupLocation":"","departureCities":[""],"category":"Holiday Package","packageType":"Standard","climate":"","tags":[""],"includedServices":[""],"fixedPrice":false,"featured":false,"destinations":[{"name":"","description":"","location":""}],"hotels":[{"name":"","description":"","location":""}],"transportation":[{"name":"","description":"","location":""}],"activities":[{"name":"","description":"","location":""}]}
Rules: Do not invent facts. Use an empty string, 0, or [] when unavailable. Convert price to a number without currency symbols. Keep itinerary as one concise line per day. For includedServices use only these IDs: ${PACKAGE_SERVICES.join(", ")}. The user request is: ${promptValue || "Use only the attached file."}`;
    const content = file instanceof File ? Buffer.from(await file.arrayBuffer()).toString("base64") : null;
    const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.1-flash-lite";
    const parts: Array<Record<string, unknown>> = [{ text: prompt }];
    if (file instanceof File && content) parts.push({ inlineData: { mimeType: file.type, data: content } });
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": key,
      },
      signal: AbortSignal.timeout(60_000),
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
      }),
    });
    const result = await response.json() as {
      error?: { message?: string };
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    if (!response.ok) return fail(result.error?.message || "Gemini could not read this request", 502);
    const text = (result.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "").trim();
    if (!text) return fail("Gemini did not return package details", 502);
    const parsed = JSON.parse(text.replace(/^```json\s*|\s*```$/g, "")) as Record<string, unknown>;
    return ok(normalize(parsed));
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") return fail("Gemini took too long to respond. Please try again with a shorter prompt or a smaller file.", 504);
    return handleError(error);
  }
}

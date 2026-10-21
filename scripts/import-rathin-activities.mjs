import fs from "node:fs";
import mongoose from "mongoose";

const envFile = process.argv.find((arg) => arg.startsWith("--env="))?.slice(6) || ".env.prod";
const dryRun = process.argv.includes("--dry-run");
const sourceBase = "https://rathin.com/webadmin/api";
// Voibee persists prices in INR. The app's fallback currency table equates INR 1 to AED 0.0385.
const AED_TO_INR = 1 / 0.0385;
const UNSPLASH_IMAGES = {
  city: [
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=85",
    "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1600&q=85",
    "https://images.unsplash.com/photo-1528702748617-c64d49f918af?auto=format&fit=crop&w=1600&q=85",
  ],
  desert: [
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=85",
    "https://images.unsplash.com/photo-1451440063999-77a8b2960d2b?auto=format&fit=crop&w=1600&q=85",
    "https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1600&q=85",
  ],
  water: [
    "https://images.unsplash.com/photo-1540946485063-a40da27545f8?auto=format&fit=crop&w=1600&q=85",
    "https://images.unsplash.com/photo-1566847438217-76e82d383f84?auto=format&fit=crop&w=1600&q=85",
    "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1600&q=85",
  ],
  adventure: [
    "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1600&q=85",
    "https://images.unsplash.com/photo-1486911278844-a81c5267e227?auto=format&fit=crop&w=1600&q=85",
    "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=85",
  ],
};

for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
}

if (!process.env.MONGODB_URI) throw new Error(`MONGODB_URI is missing from ${envFile}`);

const slugify = (value) => value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const cleanText = (value) => String(value || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim();
const listFromHtml = (value) => [...String(value || "").matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((item) => cleanText(item[1])).filter(Boolean);
const number = (value) => {
  const result = Number.parseFloat(String(value ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(result) ? result : 0;
};
const inr = (value) => Math.round(number(value) * AED_TO_INR);
const pickImage = (slug, title) => {
  const text = `${slug} ${title}`.toLowerCase();
  const group = /(desert|balloon|safari)/.test(text) ? "desert"
    : /(cruise|marina|yacht|boat|aquarium|water|dolphin|sea|beach)/.test(text) ? "water"
    : /(park|world|kids|ski|snow|aya|img|hype|garden|butterfly|zoo)/.test(text) ? "adventure"
    : "city";
  const images = UNSPLASH_IMAGES[group];
  const index = [...slug].reduce((total, char) => total + char.charCodeAt(0), 0) % images.length;
  return images[index];
};
const typeImage = (name) => {
  const value = name.toLowerCase();
  if (/culture|heritage/.test(value)) return UNSPLASH_IMAGES.water[0];
  if (/famil/.test(value)) return UNSPLASH_IMAGES.adventure[0];
  return UNSPLASH_IMAGES.city[0];
};

async function sourceJson(path, options) {
  const response = await fetch(`${sourceBase}${path}`, options);
  if (!response.ok) throw new Error(`Rathin returned ${response.status} for ${path}`);
  return response.json();
}

async function mapConcurrent(values, limit, mapper) {
  const results = new Array(values.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, async () => {
    while (next < values.length) {
      const index = next++;
      results[index] = await mapper(values[index]);
    }
  }));
  return results;
}

const catalog = await sourceJson("/get_products.php");
if (!Array.isArray(catalog.prod_list) || !catalog.prod_list.length) throw new Error("Rathin returned no activities");
const details = await mapConcurrent(catalog.prod_list, 5, async (product) => {
  const detail = await sourceJson(`/get_products_data.php?product_slug=${encodeURIComponent(product.product_slug)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  if (detail.status !== "1") throw new Error(`Could not load ${product.product_slug}`);
  return { product, detail };
});

const typeDefinitions = new Map();
for (const { detail } of details) {
  const category = detail.act_arr?.[0];
  const name = category?.act_name || "Experiences";
  const slug = slugify(name);
  if (!typeDefinitions.has(slug)) typeDefinitions.set(slug, {
    name,
    slug,
    description: `${name} experiences from Rathin Tourism.`,
    image: typeImage(name),
  });
}

if (dryRun) {
  console.log(JSON.stringify({ products: details.length, activityTypes: [...typeDefinitions.values()].map(({ name, slug }) => ({ name, slug })) }, null, 2));
  process.exit(0);
}

await mongoose.connect(process.env.MONGODB_URI, { bufferCommands: false, maxPoolSize: 6 });
try {
  const registry = mongoose.connection.useDb(process.env.PLATFORM_DATABASE || "travels_platform").db;
  const business = await registry.collection("businesses").findOne({ slug: process.env.BUSINESS_SLUG || "voibee", status: "active" });
  if (!business) throw new Error("Active Voibee business was not found in the platform registry");
  const db = mongoose.connection.useDb(business.databaseName).db;
  const now = new Date();
  const typeIds = new Map();

  for (const [slug, type] of typeDefinitions) {
    const result = await db.collection("activitytypes").findOneAndUpdate(
      { slug },
      { $set: { ...type, status: "active", featured: true, sortOrder: typeIds.size, updatedAt: now }, $setOnInsert: { createdAt: now } },
      { upsert: true, returnDocument: "after" },
    );
    typeIds.set(slug, result._id);
  }

  for (const { product, detail } of details) {
    const activityCategory = detail.act_arr?.[0]?.act_name || "Experiences";
    const ticket = detail.display_tickets_new?.specification_value_names?.[0];
    const inclusions = listFromHtml(ticket?.actDesc);
    const tags = (detail.pro_arr || []).map((tag) => cleanText(tag.pro_tag_name)).filter(Boolean);
    const sourcePrice = number(detail.product_price_starts || product.product_price_starts);
    const sourceOriginalPrice = number(detail.product_price_starts_old || product.product_price_starts_old);
    const description = cleanText(detail.product_description || detail.product_keyword || product.product_keyword);
    const slug = slugify(detail.product_slug || product.product_slug);
    const title = cleanText(detail.product_name || product.product_name);
    const destination = cleanText(detail.city_name || product.sub?.split(",")[0] || "Dubai");
    const country = cleanText(product.sub?.split(",").slice(1).join(",") || "United Arab Emirates");
    const isAvailable = /available/i.test(detail.availabilty || product.availablity || "") && !/not available/i.test(detail.availabilty || product.availablity || "");
    const activity = {
      title,
      slug,
      type: typeIds.get(slugify(activityCategory)),
      destination,
      country,
      shortDescription: cleanText(detail.product_seo_description || description).slice(0, 300),
      description,
      images: [pickImage(slug, title)],
      basePrice: inr(sourcePrice),
      originalPrice: sourceOriginalPrice > sourcePrice ? inr(sourceOriginalPrice) : 0,
      duration: "See ticket options",
      highlights: tags,
      inclusions,
      exclusions: [],
      importantInfo: ["Availability and ticket terms are confirmed at booking."],
      meetingPoint: destination,
      seasonal: tags.some((tag) => /season|offer/i.test(tag)),
      bestSelling: tags.some((tag) => /best.?seller/i.test(tag)),
      featured: tags.some((tag) => /best.?seller/i.test(tag)),
      status: isAvailable ? "active" : "inactive",
      rating: Math.min(5, number(detail.product_rating || product.product_rating)),
      reviewCount: Math.max(0, Number.parseInt(detail.rev_id_cnt, 10) || 0),
      source: { provider: "rathin", productId: detail.products_id || product.product_id, url: `https://www.rathin.com/activity/${detail.product_slug || product.product_slug}`, currency: "AED", importedAt: now },
      updatedAt: now,
    };
    await db.collection("activities").updateOne({ slug: activity.slug }, { $set: activity, $setOnInsert: { createdAt: now } }, { upsert: true });
  }

  const totals = await db.collection("activities").countDocuments({ "source.provider": "rathin" });
  const active = await db.collection("activities").countDocuments({ "source.provider": "rathin", status: "active" });
  const incomplete = await db.collection("activities").countDocuments({
    "source.provider": "rathin",
    $or: [
      { title: "" }, { slug: "" }, { type: null }, { destination: "" },
      { basePrice: { $lte: 0 } }, { images: { $size: 0 } },
      { shortDescription: "" }, { description: "" },
    ],
  });
  const unsplashImages = await db.collection("activities").countDocuments({
    "source.provider": "rathin",
    "images.0": { $regex: "^https://images\\.unsplash\\.com/" },
  });
  const rathinImages = await db.collection("activities").countDocuments({
    "source.provider": "rathin",
    images: { $elemMatch: { $regex: "rathincom\\.b-cdn\\.net" } },
  });
  const rathinTypeImages = await db.collection("activitytypes").countDocuments({ image: { $regex: "rathincom\\.b-cdn\\.net" } });
  console.log(JSON.stringify({ imported: details.length, sourceActivitiesInVoibee: totals, active, inactive: totals - active, incompleteRequiredDisplayFields: incomplete, unsplashImages, rathinImages, rathinTypeImages, currencyRate: AED_TO_INR }, null, 2));
} finally {
  await mongoose.disconnect();
}

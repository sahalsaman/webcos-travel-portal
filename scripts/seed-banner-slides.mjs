import fs from "node:fs";
import mongoose from "mongoose";

const envArg = process.argv.find((arg) => arg.startsWith("--env="));
const envFile = envArg?.slice("--env=".length) || ".env.local";

if (!fs.existsSync(envFile)) {
  throw new Error(`Environment file not found: ${envFile}`);
}

for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
  if (!match || process.env[match[1]]) continue;
  process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
}

if (!process.env.MONGODB_URI) throw new Error(`MONGODB_URI is missing from ${envFile}`);

const slides = [
  {
    seedKey: "voibee-banner-discover",
    title: "Discover unforgettable trips.",
    description: "Enjoy thoughtfully planned holidays with clear itineraries, trusted stays, and dedicated support throughout your journey.",
    image: "/hero-experience.webp",
    href: "/packages",
    ctaLabel: "Explore packages",
    sortOrder: 0,
  },
  {
    seedKey: "voibee-banner-india",
    title: "Experience the best of India.",
    description: "From peaceful backwaters to spectacular mountain escapes, find a journey made for every kind of traveler.",
    image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1800&q=85",
    href: "/packages?country=India",
    ctaLabel: "Explore India",
    sortOrder: 1,
  },
  {
    seedKey: "voibee-banner-global",
    title: "Your world of holidays awaits.",
    description: "Explore inspiring international destinations with curated packages, transparent pricing, and support you can rely on.",
    image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1800&q=85",
    href: "/packages?country=International",
    ctaLabel: "Explore the world",
    sortOrder: 2,
  },
];

await mongoose.connect(process.env.MONGODB_URI);
const businessSlug = process.env.BUSINESS_SLUG;
if (!businessSlug) throw new Error("Set BUSINESS_SLUG explicitly before seeding.");
const registry = mongoose.connection.useDb(process.env.PLATFORM_DATABASE || "travels_platform");
const business = await registry.collection("businesses").findOne({ slug: businessSlug, status: "active" });
if (!business) throw new Error("Unknown or suspended business");
const tenantDatabase = mongoose.connection.useDb(business.databaseName).db;
const banners = tenantDatabase.collection("offercards");
let created = 0;

for (const slide of slides) {
  const now = new Date();
  const result = await banners.updateOne(
    { $or: [{ tags: slide.seedKey }, { title: slide.title }] },
    {
      $setOnInsert: {
        title: slide.title,
        description: slide.description,
        images: [slide.image],
        href: slide.href,
        ctaLabel: slide.ctaLabel,
        priceLabel: "",
        status: "active",
        featured: true,
        sortOrder: slide.sortOrder,
        tags: ["homepage", "banner", slide.seedKey],
        country: "Global",
        countryCode: "GL",
        createdAt: now,
        updatedAt: now,
      },
    },
    { upsert: true },
  );
  created += result.upsertedCount;
}

console.log(`Banner seed complete for ${envFile}: ${created} created, ${slides.length - created} already present.`);
if (process.argv.includes("--verify")) {
  const seededSlides = await banners
    .find({ tags: { $in: slides.map((slide) => slide.seedKey) } })
    .project({ title: 1, status: 1, sortOrder: 1, href: 1 })
    .sort({ sortOrder: 1 })
    .toArray();
  console.log(JSON.stringify(seededSlides.map(({ title, status, sortOrder, href }) => ({ title, status, sortOrder, href })), null, 2));
}
await mongoose.disconnect();

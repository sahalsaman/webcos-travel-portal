import fs from "node:fs";
import mongoose from "mongoose";

const envFile = process.argv.find((arg) => arg.startsWith("--env="))?.slice(6) || ".env.local";
const businessSlug = process.env.BUSINESS_SLUG || "voibee";

if (!fs.existsSync(envFile)) throw new Error(`Environment file not found: ${envFile}`);
for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
}
if (!process.env.MONGODB_URI) throw new Error(`MONGODB_URI is missing from ${envFile}`);

await mongoose.connect(process.env.MONGODB_URI);
const registry = mongoose.connection.useDb(process.env.PLATFORM_DATABASE || "travels_platform");
const business = await registry.collection("businesses").findOne({ slug: businessSlug, status: "active" });
if (!business) throw new Error(`Unknown or suspended business: ${businessSlug}`);

const db = mongoose.connection.useDb(business.databaseName).db;
const now = new Date();
const destinations = [
  {
    title: "Munnar",
    description: "Misty tea plantations, waterfalls and cool mountain air in Kerala’s Western Ghats.",
    country: "India", countryCode: "IN", basePrice: 12900, featured: true, popular: true,
    tags: ["Kerala", "mountains", "nature"],
    images: ["https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1600&q=85"],
  },
  {
    title: "Goa",
    description: "Golden beaches, Portuguese heritage, local food and relaxed coastal days.",
    country: "India", countryCode: "IN", basePrice: 15900, featured: true, popular: true,
    tags: ["beaches", "coast", "weekend"],
    images: ["https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1600&q=85"],
  },
  {
    title: "Kashmir",
    description: "A scenic Himalayan escape with Dal Lake, alpine valleys and unforgettable landscapes.",
    country: "India", countryCode: "IN", basePrice: 24500, featured: true, popular: true,
    tags: ["Himalayas", "lakes", "scenic"],
    images: ["https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1600&q=85"],
  },
  {
    title: "Rajasthan",
    description: "Royal forts, colorful markets, desert sunsets and centuries of living heritage.",
    country: "India", countryCode: "IN", basePrice: 21900, featured: false, popular: true,
    tags: ["heritage", "culture", "desert"],
    images: ["https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1600&q=85"],
  },
  {
    title: "Kerala Backwaters",
    description: "A peaceful journey through palm-fringed canals, village life and traditional houseboats.",
    country: "India", countryCode: "IN", basePrice: 17900, featured: false, popular: true,
    tags: ["Kerala", "backwaters", "slow travel"],
    images: ["https://images.unsplash.com/photo-1602309113731-5f3f1e8b8f0d?auto=format&fit=crop&w=1600&q=85"],
  },
  {
    title: "Andaman & Nicobar Islands",
    description: "Turquoise waters, white-sand beaches and vibrant coral reefs in India’s island paradise.",
    country: "India", countryCode: "IN", basePrice: 28900, featured: true, popular: false,
    tags: ["islands", "beaches", "snorkeling"],
    images: ["https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=85"],
  },
  {
    title: "Dubai",
    description: "A vibrant Gulf city of skyline views, desert adventures, shopping and waterfront experiences.",
    country: "United Arab Emirates", countryCode: "AE", basePrice: 38900, featured: true, popular: true,
    tags: ["city", "desert", "luxury"],
    images: ["https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=85"],
  },
  {
    title: "Bali",
    description: "Rice terraces, temple ceremonies, beaches and slow island days in Indonesia.",
    country: "Indonesia", countryCode: "ID", basePrice: 45900, featured: true, popular: true,
    tags: ["island", "wellness", "culture"],
    images: ["https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1600&q=85"],
  },
  {
    title: "Maldives",
    description: "Clear lagoons, coral islands and peaceful overwater stays for a restorative escape.",
    country: "Maldives", countryCode: "MV", basePrice: 69900, featured: true, popular: false,
    tags: ["island", "beaches", "honeymoon"],
    images: ["https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1600&q=85"],
  },
  {
    title: "Singapore",
    description: "A polished city break with gardens, global food, family attractions and waterfront neighborhoods.",
    country: "Singapore", countryCode: "SG", basePrice: 32900, featured: false, popular: true,
    tags: ["city", "family", "food"],
    images: ["https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1600&q=85"],
  },
  {
    title: "Thailand",
    description: "Temple-lined cities, tropical islands, vibrant markets and warm Thai hospitality.",
    country: "Thailand", countryCode: "TH", basePrice: 36900, featured: false, popular: true,
    tags: ["beaches", "culture", "food"],
    images: ["https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1600&q=85"],
  },
  {
    title: "Mauritius",
    description: "A relaxed Indian Ocean escape with lagoons, volcanic landscapes and coastal villages.",
    country: "Mauritius", countryCode: "MU", basePrice: 57900, featured: true, popular: false,
    tags: ["island", "beaches", "nature"],
    images: ["https://images.unsplash.com/photo-1516690561799-46d8f74f9abf?auto=format&fit=crop&w=1600&q=85"],
  },
];

let created = 0;
for (const destination of destinations) {
  const result = await db.collection("destinations").updateOne(
    { title: destination.title },
    { $setOnInsert: { ...destination, status: "active", createdAt: now, updatedAt: now } },
    { upsert: true },
  );
  created += result.upsertedCount || 0;
}

console.log(`Seed complete for ${businessSlug} in ${envFile}: ${created} destinations created, ${destinations.length - created} already present.`);
if (process.argv.includes("--verify")) {
  const rows = await db.collection("destinations")
    .find({ title: { $in: destinations.map((item) => item.title) } })
    .project({ title: 1, country: 1, countryCode: 1, status: 1, featured: 1, popular: 1 })
    .sort({ title: 1 })
    .toArray();
  console.log(JSON.stringify(rows, null, 2));
}

await mongoose.disconnect();

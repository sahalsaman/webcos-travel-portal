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

const trip = {
  title: "Munnar Stranger-to-Friends Weekend",
  slug: "munnar-stranger-to-friends-weekend",
  destination: "Munnar",
  country: "India",
  description: "Come as strangers and leave as friends on a social 2-day Munnar escape for working professionals. Travel from Kochi in a premium AC coach, stay at a scenic resort, meet new people through hosted games and team challenges, and enjoy Munnar’s tea valleys at an easy group pace.",
  images: [
    "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1800&q=85",
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
  ],
  durationDays: 2,
  totalSeats: 28,
  availableSeats: 28,
  startDate: new Date("2026-11-14T00:00:00.000Z"),
  endDate: new Date("2026-11-15T00:00:00.000Z"),
  pickupLocation: "Kochi / Ernakulam",
  departureCities: ["Kochi", "Ernakulam"],
  basePrice: 10999,
  category: "Strangers",
  packageType: "Premium",
  holidayPackage: false,
  status: "active",
  featured: true,
  rating: 0,
  reviewCount: 0,
  tags: ["Voibee Stranger Trips", "Munnar", "social escape", "working professionals", "fixed departure"],
  includedServices: ["hotels", "sightseeing", "meals", "tour-manager", "Transportation"],
  inclusions: [
    "🚍 AC Premium Transportation from Kochi and back",
    "🏨 1 Night Accommodation at a selected Munnar resort",
    "🍹 Welcome Drink on arrival",
    "🍽️ Day 1 Breakfast",
    "🍛 Day 1 Lunch",
    "🍽️ Day 1 Dinner",
    "🍳 Day 2 Breakfast",
    "🍛 Day 2 Lunch",
    "🌿 Munnar Sightseeing as per itinerary",
    "🎯 Voibee Ice-Breaking Activities",
    "🤝 Stranger-to-Friends Social Games",
    "🏆 Team Challenges & Fun Activities",
    "🔥 Campfire Evening subject to resort/weather conditions",
    "🎤 Antakshari / Open Mic / Group Activities",
    "📸 Group Photography & Trip Moments",
    "🎥 Reel & Photo Challenges",
    "🏅 Voibee Team Awards",
    "☕ Chai & Conversations Session",
    "🧑‍💼 Professional Trip Coordinator",
    "🩹 Basic First-Aid Support",
    "💧 Drinking Water during the trip",
    "🧳 Luggage Assistance/Handling at the resort, where provided by the property",
  ],
  exclusions: [
    "Personal expenses",
    "Expenses incurred outside the itinerary",
    "Alcoholic beverages",
    "Cigarettes, tobacco or other personal consumables",
    "Room service",
    "Laundry",
    "Additional food or beverages outside the included meals",
    "Resort-paid activities or facilities not specifically mentioned",
    "Boating / adventure activities unless specifically mentioned as included",
    "Entry fees not specifically mentioned in the package",
    "Shopping expenses",
    "Personal photography/videography expenses",
    "Travel insurance",
    "Medical expenses and personal medication",
    "Any expenses arising due to weather, roadblocks, natural calamities or other circumstances beyond Voibee’s control",
    "Any additional transportation required due to personal reasons",
    "Anything not specifically mentioned under Package Inclusions",
  ],
  itinerary: [
    {
      day: 1,
      title: "Kochi to Munnar and the Voibee social evening",
      description: "A hosted journey from Kochi to the resort with structured introductions, scenic stops and a full evening of games, conversations and campfire activities.",
      schedule: [
        { time: "06:00", title: "Meet & greet at Kochi", description: "Registration, attendance, welcome drink, name tags, trip briefing and the opening group photograph." },
        { time: "06:30", title: "Departure from Kochi", description: "Start the premium AC coach journey with a hosted Get to Know Me game and randomized seating." },
        { time: "08:30", title: "Breakfast stop", description: "Kerala breakfast followed by the 3 Things About Me ice-breaker." },
        { time: "10:30", title: "Cheeyappara / Valara scenic stop", description: "Short waterfall photo stop and refreshments, subject to route and road conditions." },
        { time: "12:30", title: "Munnar scenic drive", description: "Tea plantations, mountain views and guided photo stops on the way to the resort." },
        { time: "13:30", title: "Group lunch", description: "Kerala-style buffet lunch." },
        { time: "15:00", title: "Resort check-in", description: "Settle into the selected Munnar resort and prepare for the hosted social programme." },
        { time: "16:00", title: "Voibee social games", description: "Find Your Stranger, random team challenges, treasure hunt, quiz, charades and reel challenges." },
        { time: "17:30", title: "Chai & Conversations", description: "Tea or coffee with randomly assigned conversation partners and guided prompt cards." },
        { time: "19:30", title: "Voibee campfire night", description: "Welcome mocktails, dinner, open mic, antakshari, travel stories, group dance and team awards." },
        { time: "23:00", title: "Free time", description: "Relax, continue conversations or enjoy the resort facilities." },
      ],
      transports: [{ title: "Premium AC coach from Kochi", description: "Shared return transport from Kochi / Ernakulam with hosted group coordination." }],
      hotels: [{ name: "Selected Munnar resort", description: "Scenic group property with common space, group dining and campfire arrangements. Final property is confirmed before departure.", image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80", verified: false }],
      meals: ["breakfast", "lunch", "dinner"],
      sightseeing: [{ name: "Cheeyappara / Valara Waterfalls", description: "A short scenic stop on the Kochi–Munnar route, subject to road and weather conditions.", image: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=1000&q=80" }],
    },
    {
      day: 2,
      title: "Munnar tea valley circuit and return to Kochi",
      description: "A relaxed Munnar circuit through Mattupetty, Echo Point, Kundala and Top Station, ending with a friendship circle on the journey back to Kochi.",
      schedule: [
        { time: "06:30", title: "Optional sunrise walk", description: "Nature walk and photography for interested participants; others can sleep in." },
        { time: "08:00", title: "Breakfast at the resort", description: "Buffet breakfast before check-out." },
        { time: "09:00", title: "Check-out and luggage loading", description: "Load luggage into the coach and begin the Munnar tea valley circuit." },
        { time: "10:00", title: "Mattupetty Dam", description: "Group photograph and short exploration beside the lake and reservoir." },
        { time: "11:15", title: "Echo Point", description: "Fun group activity, views and photographs." },
        { time: "12:00", title: "Kundala", description: "Tea plantation scenery, lake views and optional boating at the traveler’s own cost." },
        { time: "13:00", title: "Top Station photo challenge", description: "Teams create a best group photo, 15-second reel, funniest photo and most creative photo, subject to weather and access." },
        { time: "14:30", title: "Group lunch", description: "Lunch during the return circuit." },
        { time: "15:30", title: "Kannan Devan Tea Museum", description: "Tea production and tasting experience if timing, tickets and operating conditions permit." },
        { time: "16:30", title: "Return journey and Friendship Circle", description: "Share a favourite moment and the first new friend you would travel with again." },
        { time: "20:30–21:00", title: "Kochi arrival", description: "Drop-off in Kochi / Ernakulam and close the Munnar Stranger-to-Friends Weekend." },
      ],
      transports: [{ title: "Return coach to Kochi", description: "Shared return journey with a hosted Friendship Circle." }],
      meals: ["breakfast", "lunch"],
      sightseeing: [
        { name: "Mattupetty Dam", description: "Lake and reservoir views with time for a group photograph.", image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1000&q=80" },
        { name: "Echo Point and Kundala", description: "A scenic tea valley circuit with viewpoints and optional boating.", image: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1000&q=80" },
        { name: "Top Station", description: "Panoramic Western Ghats views and the Voibee team photo challenge, subject to weather and access.", image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80" },
      ],
    },
  ],
};

const result = await db.collection("trips").updateOne(
  { slug: trip.slug },
  { $setOnInsert: { ...trip, createdAt: now, updatedAt: now } },
  { upsert: true },
);
console.log(`Munnar package seed for ${businessSlug}: ${result.upsertedCount ? "created" : "already present"}.`);
if (process.argv.includes("--verify")) {
  const row = await db.collection("trips").findOne({ slug: trip.slug }, { projection: { title: 1, slug: 1, destination: 1, category: 1, status: 1, basePrice: 1, startDate: 1, endDate: 1, totalSeats: 1, availableSeats: 1, "itinerary.day": 1, "itinerary.schedule": 1 } });
  console.log(JSON.stringify(row, null, 2));
}
await mongoose.disconnect();

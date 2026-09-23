import fs from "node:fs";
import mongoose from "mongoose";

const envFile = process.argv.find((arg) => arg.startsWith("--env="))?.slice(6) || ".env.local";
if (!fs.existsSync(envFile)) throw new Error(`Environment file not found: ${envFile}`);
for (const line of fs.readFileSync(envFile, "utf8").split("\n")) { const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/); if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, ""); }
if (!process.env.MONGODB_URI) throw new Error(`MONGODB_URI is missing from ${envFile}`);

await mongoose.connect(process.env.MONGODB_URI);
const businessSlug = process.env.BUSINESS_SLUG;
if (!businessSlug) throw new Error("Set BUSINESS_SLUG explicitly before seeding.");
const registry = mongoose.connection.useDb(process.env.PLATFORM_DATABASE || "travels_platform");
const business = await registry.collection("businesses").findOne({ slug: businessSlug, status: "active" });
if (!business) throw new Error("Unknown or suspended business");
const tenantDatabase = mongoose.connection.useDb(business.databaseName).db;
const db = tenantDatabase;
const now = new Date();
const common = {
  status: "active", featured: true, packageType: "Standard", includedServices: ["hotels", "sightseeing", "meals", "transfers", "travel-insurance"],
  visaRequired: false, visaNote: "", visaDocuments: [], visaFee: 0, permitRequired: false, permitNote: "", permitDocuments: [], permitFee: 0,
  exclusions: ["Flights unless specifically mentioned", "Personal expenses", "Anything not listed under inclusions"], rating: 4.8, reviewCount: 0,
};
const packages = [
  {
    title: "Rishikesh Adventure Circle", slug: "rishikesh-adventure-circle", destination: "Rishikesh", country: "India", category: "Strangers", holidayPackage: false,
    description: "A social fixed-departure escape for travelers who want river adventures, mountain views and a welcoming new travel circle.",
    images: ["https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1600&q=85"], basePrice: 18900, durationDays: 4, totalSeats: 18, availableSeats: 18,
    startDate: new Date("2026-11-12T00:00:00.000Z"), endDate: new Date("2026-11-15T00:00:00.000Z"), pickupLocation: "Dehradun Airport / Haridwar Railway Station", departureCities: ["Delhi", "Mumbai", "Bengaluru"], tags: ["Voibee Circles", "adventure", "fixed departure"],
    inclusions: ["Three nights verified accommodation", "Daily breakfast and dinner", "Guided rafting and local experiences", "All scheduled transfers"],
    itinerary: [
      { day: 1, title: "Arrive and meet your circle", description: "Arrive in Rishikesh, settle in and join a hosted welcome evening by the Ganges.", transports: [{ title: "Arrival transfer", description: "Shared pickup from Dehradun or Haridwar." }], hotels: [{ name: "Aloha on the Ganges", description: "River-facing premium stay with hosted group spaces.", image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80", verified: true }], meals: ["dinner"], sightseeing: [] },
      { day: 2, title: "Rafting and riverside stories", description: "Guided rafting followed by a relaxed café trail and evening circle session.", transports: [], hotels: [], meals: ["breakfast", "dinner"], sightseeing: [{ name: "Ganges rafting", description: "Professionally guided rafting experience.", image: "https://images.unsplash.com/photo-1530866495561-507c9faab2ed?auto=format&fit=crop&w=1000&q=80" }] },
      { day: 3, title: "Waterfall hike and Ganga Aarti", description: "A scenic group hike and a spiritual evening at Triveni Ghat.", transports: [], hotels: [], meals: ["breakfast", "dinner"], sightseeing: [{ name: "Triveni Ghat", description: "Attend the evening Ganga Aarti.", image: "https://images.unsplash.com/photo-1604608672516-f1b9b1d37076?auto=format&fit=crop&w=1000&q=80" }] },
      { day: 4, title: "Breakfast and departure", description: "Share a final breakfast before scheduled departures.", transports: [{ title: "Departure transfer", description: "Shared drop to Dehradun or Haridwar." }], hotels: [], meals: ["breakfast"], sightseeing: [] },
    ],
  },
  {
    title: "Golden Kerala Wellness Escape", slug: "golden-kerala-wellness-escape", destination: "Kumarakom", country: "India", category: "Golden Horizons (Senior Care)", holidayPackage: true,
    description: "A gentle Kerala journey designed for senior travelers, with comfortable pacing, wellness time and attentive on-trip support.",
    images: ["https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1600&q=85"], basePrice: 42500, durationDays: 5, totalSeats: 0, availableSeats: 0,
    startDate: new Date("2026-10-01T00:00:00.000Z"), endDate: new Date("2026-10-05T00:00:00.000Z"), pickupLocation: "Kochi Airport", departureCities: ["Kochi"], tags: ["senior care", "wellness", "slow travel"], packageType: "Luxury",
    inclusions: ["Four nights accessible verified accommodation", "Daily breakfast and dinner", "Private air-conditioned vehicle", "Trip companion support", "One Ayurvedic wellness consultation"],
    itinerary: [
      { day: 1, title: "Comfortable arrival in Kumarakom", description: "Assisted airport pickup and an easy transfer to the backwaters.", transports: [{ title: "Private arrival transfer", description: "Door-to-door air-conditioned vehicle." }], hotels: [{ name: "Coconut Lagoon Kumarakom", description: "A serene backwater resort selected for comfort, service and easy-paced stays.", image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80", verified: true }], meals: ["dinner"], sightseeing: [] },
      { day: 2, title: "Backwater cruise", description: "A relaxed private cruise with seated dining and minimal walking.", transports: [], hotels: [], meals: ["breakfast", "lunch", "dinner"], sightseeing: [{ name: "Vembanad Lake", description: "Gentle sightseeing across Kerala’s famous backwaters.", image: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1000&q=80" }] },
      { day: 3, title: "Wellness and leisure", description: "Ayurvedic consultation, optional therapy and a free afternoon.", transports: [], hotels: [], meals: ["breakfast", "dinner"], sightseeing: [] },
      { day: 4, title: "Kumarakom village experience", description: "A guided, easy-paced cultural visit with frequent rest stops.", transports: [], hotels: [], meals: ["breakfast", "dinner"], sightseeing: [] },
      { day: 5, title: "Assisted departure", description: "Breakfast and private transfer to Kochi Airport.", transports: [{ title: "Private departure transfer", description: "Assisted drop at the airport." }], hotels: [], meals: ["breakfast"], sightseeing: [] },
    ],
  },
  {
    title: "Accessible Dubai Discovery", slug: "accessible-dubai-discovery", destination: "Dubai", country: "United Arab Emirates", category: "Limitless Access (Mobility Support)", holidayPackage: true,
    description: "A barrier-aware Dubai holiday with accessible transfers, verified accommodation and thoughtfully selected attractions.",
    images: ["https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=85"], basePrice: 68500, durationDays: 5, totalSeats: 0, availableSeats: 0,
    startDate: new Date("2026-10-01T00:00:00.000Z"), endDate: new Date("2026-10-05T00:00:00.000Z"), pickupLocation: "Dubai International Airport", departureCities: ["Dubai"], tags: ["accessible travel", "mobility support", "Dubai"], packageType: "Premium",
    inclusions: ["Four nights verified accessible accommodation", "Wheelchair-friendly private transfers", "Daily breakfast", "Accessible attraction tickets", "Local support coordinator"],
    itinerary: [
      { day: 1, title: "Accessible arrival", description: "Meet-and-assist arrival with an accessible vehicle transfer.", transports: [{ title: "Accessible airport transfer", description: "Pre-arranged vehicle based on mobility requirements." }], hotels: [{ name: "Sofitel Dubai Downtown", description: "Central verified property with step-free access and accessible room options.", image: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=80", verified: true }], meals: [], sightseeing: [] },
      { day: 2, title: "Burj Khalifa and Dubai Mall", description: "Step-free city highlights with reserved assistance windows.", transports: [], hotels: [], meals: ["breakfast"], sightseeing: [{ name: "Burj Khalifa", description: "Accessible observation deck experience.", image: "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1000&q=80" }] },
      { day: 3, title: "Modern Dubai panorama", description: "Dubai Marina, Bluewaters Island and Palm viewpoints.", transports: [], hotels: [], meals: ["breakfast"], sightseeing: [] },
      { day: 4, title: "Accessible desert evening", description: "A carefully coordinated desert camp experience with mobility-aware arrangements.", transports: [], hotels: [], meals: ["breakfast", "dinner"], sightseeing: [] },
      { day: 5, title: "Departure support", description: "Breakfast and assisted airport transfer.", transports: [{ title: "Accessible departure transfer", description: "Hotel-to-airport assistance." }], hotels: [], meals: ["breakfast"], sightseeing: [] },
    ],
  },
  {
    title: "Bespoke Bali Private Journey", slug: "bespoke-bali-private-journey", destination: "Bali", country: "Indonesia", category: "Bespoke Private Journeys", holidayPackage: true,
    description: "A fully private Bali escape with a dedicated vehicle, flexible days and refined stays shaped around your pace.",
    images: ["https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1600&q=85"], basePrice: 118000, durationDays: 6, totalSeats: 0, availableSeats: 0,
    startDate: new Date("2026-10-01T00:00:00.000Z"), endDate: new Date("2026-10-06T00:00:00.000Z"), pickupLocation: "Ngurah Rai International Airport", departureCities: ["Bali"], tags: ["private journey", "luxury", "Bali"], packageType: "Luxury",
    inclusions: ["Five nights luxury verified accommodation", "Private chauffeured vehicle", "Daily breakfast", "Private local guide", "Curated dining reservation assistance"],
    itinerary: [
      { day: 1, title: "Private welcome to Ubud", description: "VIP arrival assistance and private transfer through the countryside.", transports: [{ title: "Private airport transfer", description: "Dedicated premium vehicle." }], hotels: [{ name: "Maya Ubud Resort & Spa", description: "Luxury forest retreat with private-service options and tranquil grounds.", image: "https://images.unsplash.com/photo-1533669955142-6a73332af4db?auto=format&fit=crop&w=1200&q=80", verified: true }], meals: [], sightseeing: [] },
      { day: 2, title: "Ubud your way", description: "Choose temples, art villages, rice terraces or a private wellness day.", transports: [], hotels: [], meals: ["breakfast"], sightseeing: [] },
      { day: 3, title: "Waterfalls and private lunch", description: "A flexible scenic drive with a reserved private dining experience.", transports: [], hotels: [], meals: ["breakfast", "lunch"], sightseeing: [] },
      { day: 4, title: "Transfer to the coast", description: "Private transfer to Nusa Dua with optional stops selected with your guide.", transports: [], hotels: [{ name: "The Apurva Kempinski Bali", description: "Oceanfront luxury with expansive facilities and polished private service.", image: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=80", verified: true }], meals: ["breakfast"], sightseeing: [] },
      { day: 5, title: "Private coastal day", description: "A flexible beach, spa or cultural itinerary with your chauffeur on standby.", transports: [], hotels: [], meals: ["breakfast"], sightseeing: [] },
      { day: 6, title: "Private departure", description: "Breakfast and a private transfer to the airport.", transports: [{ title: "Private departure transfer", description: "Dedicated hotel-to-airport vehicle." }], hotels: [], meals: ["breakfast"], sightseeing: [] },
    ],
  },
];

let packageCreated = 0;
for (const item of packages) { const result = await db.collection("trips").updateOne({ slug: item.slug }, { $setOnInsert: { ...common, ...item, createdAt: now, updatedAt: now } }, { upsert: true }); packageCreated += result.upsertedCount; }

const hotels = [
  ["Aloha on the Ganges", "Rishikesh", "India", "IN", "+91 135 244 0000", "River-facing resort used for hosted Voibee Circle stays."],
  ["Coconut Lagoon Kumarakom", "Kumarakom", "India", "IN", "+91 481 252 4491", "Backwater resort selected for senior-friendly paced journeys."],
  ["Sofitel Dubai Downtown", "Dubai", "United Arab Emirates", "AE", "+971 4 503 6666", "Central property with accessible-room options."],
  ["Maya Ubud Resort & Spa", "Ubud", "Indonesia", "ID", "+62 361 977 888", "Luxury Ubud retreat for private journeys."],
  ["The Apurva Kempinski Bali", "Nusa Dua", "Indonesia", "ID", "+62 361 209 2288", "Oceanfront luxury property for bespoke stays."],
];
let hotelCreated = 0;
for (const [companyName, city, country, countryCode, phone, notes] of hotels) { const result = await db.collection("suppliers").updateOne({ companyName, type: "Hotel" }, { $setOnInsert: { companyName, contactName: "Reservations Team", email: "", phone, type: "Hotel", status: "active", country, countryCode, city, address: "", taxId: "", commissionRate: 0, notes, createdAt: now, updatedAt: now } }, { upsert: true }); hotelCreated += result.upsertedCount; }

console.log(`Seed complete for ${envFile}: ${packageCreated} Vibe Circle packages and ${hotelCreated} hotels created.`);
if (process.argv.includes("--verify")) {
  const tripRows = await db.collection("trips").find({ slug: { $in: packages.map((item) => item.slug) } }).project({ title: 1, slug: 1, category: 1, status: 1 }).sort({ slug: 1 }).toArray();
  const hotelRows = await db.collection("suppliers").find({ companyName: { $in: hotels.map((item) => item[0]) }, type: "Hotel" }).project({ companyName: 1, city: 1, status: 1 }).sort({ companyName: 1 }).toArray();
  console.log(JSON.stringify({ packages: tripRows, hotels: hotelRows }, null, 2));
}
await mongoose.disconnect();

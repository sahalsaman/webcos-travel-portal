import fs from "node:fs";
import mongoose from "mongoose";

const envFile = process.argv.find((arg) => arg.startsWith("--env="))?.slice(6) || ".env.prod";
if (!fs.existsSync(envFile)) throw new Error(`Environment file not found: ${envFile}`);

for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
}

if (!process.env.MONGODB_URI) throw new Error(`MONGODB_URI is missing from ${envFile}`);

const image = (id, width = 1600) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;
const standardExclusions = [
  "International or domestic flights unless specifically mentioned",
  "Visa fees and visa processing charges",
  "Travel insurance",
  "Personal expenses, tips and gratuities",
  "Meals, activities and entry fees not listed under inclusions",
  "Anything not specifically mentioned under Package Inclusions",
];

function itineraryDay(day, title, description, imageUrl, sightName, sightDescription, meals = ["breakfast"]) {
  return {
    day,
    title,
    description,
    specials: [],
    highlights: [{ image: imageUrl }],
    schedule: [],
    hotels: [],
    transports: [],
    meals,
    sightseeing: [{ name: sightName, description: sightDescription, image: imageUrl }],
  };
}

const munnarUpdate = {
  title: "MUNNAR SOCIAL ESCAPE | Stranger-to-Friends Weekend",
  description: "A hosted 2-day Munnar social escape for working professionals who want to meet new people while enjoying Kerala’s tea-country scenery. The trip combines shared coach travel from Kochi, a relaxed resort stay, guided introductions, group games and the familiar Munnar valley circuit at an unhurried pace.",
  images: [
    image("photo-1602216056096-3b40cc0c9944"),
    image("photo-1500530855697-b586d89ba3ee"),
  ],
  durationDays: 2,
  category: "Work Escape",
  packageType: "Premium",
  climate: "Cool",
  holidayPackage: false,
  fixedPrice: true,
  includedServices: ["hotels", "sightseeing", "meals", "tour-manager", "ac-premium-transportation", "cam-fire", "activities", "photography", "first-aid", "drinking-water", "welcome-drink"],
  tags: ["Munnar", "social escape", "working professionals", "fixed departure", "Voibee Circles"],
  itinerary: [
    {
      day: 1,
      title: "Kochi to Munnar and the hosted social evening",
      description: "Travel together from Kochi to Munnar, stop for the scenery on the route, then settle into the group stay before an evening of hosted introductions, games and conversations.",
      specials: ["Hosted welcome circle", "Stranger-to-friends games", "Campfire evening subject to weather"],
      highlights: [
        { image: image("photo-1602216056096-3b40cc0c9944", 1000) },
        { image: image("photo-1464822759023-fed622ff2c3b", 1000) },
        { image: image("photo-1433086966358-54859d0ed716", 1000) },
      ],
      schedule: [
        { time: "06:30", title: "Kochi departure", description: "Group check-in, trip briefing and the shared drive towards Munnar." },
        { time: "10:30", title: "Scenic route stop", description: "A short stop at a waterfall or viewpoint, subject to road and weather conditions." },
        { time: "15:00", title: "Check-in and free time", description: "Settle into the group stay before the evening programme." },
        { time: "17:00", title: "Hosted social programme", description: "Introductions, team challenges, conversation prompts and a group photo session." },
        { time: "19:30", title: "Dinner and campfire", description: "Dinner followed by a campfire, open mic or group activity when conditions permit." },
      ],
      hotels: [],
      transports: [],
      meals: ["breakfast", "lunch", "dinner"],
      sightseeing: [
        { name: "Cheeyappara and Valara route", description: "A scenic Kochi–Munnar route with short photo stops subject to traffic, weather and road conditions.", image: image("photo-1433086966358-54859d0ed716", 1000) },
      ],
    },
    {
      day: 2,
      title: "Munnar valley circuit and return to Kochi",
      description: "Explore the tea-country viewpoints around Munnar before the shared return journey and a final friendship circle with the group.",
      specials: ["Tea-valley viewpoints", "Group photo challenge", "Friendship circle"],
      highlights: [
        { image: image("photo-1464822759023-fed622ff2c3b", 1000) },
        { image: image("photo-1500534623283-312aade485b7", 1000) },
        { image: image("photo-1602216056096-3b40cc0c9944", 1000) },
      ],
      schedule: [
        { time: "08:00", title: "Breakfast and check-out", description: "Breakfast, check-out and luggage loading before sightseeing." },
        { time: "10:00", title: "Munnar sightseeing circuit", description: "Mattupetty, Echo Point and Kundala are planned according to local conditions and available time." },
        { time: "15:30", title: "Return to Kochi", description: "Begin the return journey with a hosted wrap-up and friendship circle." },
      ],
      hotels: [],
      transports: [],
      meals: ["breakfast", "lunch"],
      sightseeing: [
        { name: "Mattupetty, Echo Point and Kundala", description: "A classic Munnar tea-valley circuit; exact stops depend on weather, traffic and local access.", image: image("photo-1500534623283-312aade485b7", 1000) },
        { name: "Top Station viewpoint", description: "A panoramic Western Ghats viewpoint when weather, time and access allow.", image: image("photo-1464822759023-fed622ff2c3b", 1000) },
      ],
    },
  ],
};

const packages = [
  {
    title: "Dubai City & Desert Holiday", slug: "dubai-city-desert-holiday", destination: "Dubai", country: "United Arab Emirates", category: "Holiday Package", packageType: "Premium", climate: "Warm", basePrice: 49900, durationDays: 4, featured: true,
    description: "A flexible Dubai holiday that pairs the city’s skyline, waterfront neighbourhoods and old trading districts with a desert experience. The final day plan is shaped around your confirmed arrival and departure times.",
    images: [image("photo-1512453979798-5ea266f8880c")], tags: ["Dubai", "city break", "desert", "international holiday"],
    itinerary: [
      itineraryDay(1, "Arrival in Dubai", "Private arrival assistance and time to settle in after check-in.", image("photo-1512453979798-5ea266f8880c", 1000), "Dubai Marina", "A waterfront district of restaurants, promenades and skyline views."),
      itineraryDay(2, "Modern Dubai", "A city day built around the Downtown area, subject to attraction availability and chosen tickets.", image("photo-1518684079-3c830dcef090", 1000), "Burj Khalifa and Dubai Mall", "Visits are planned around confirmed entry slots and operating hours."),
      itineraryDay(3, "Desert experience", "A late-afternoon desert programme can be arranged with a licensed local operator.", image("photo-1500534623283-312aade485b7", 1000), "Dubai desert reserve area", "Desert activities depend on the operator, weather and selected experience."),
      itineraryDay(4, "Departure", "Breakfast and transfer planning according to your flight time.", image("photo-1512453979798-5ea266f8880c", 1000), "Dubai Creek", "A historic trading-waterfront area to visit when time permits."),
    ],
  },
  {
    title: "Kerala Hills, Wildlife & Backwaters", slug: "kerala-hills-wildlife-backwaters", destination: "Kerala", country: "India", category: "Holiday Package", packageType: "Premium", climate: "Tropical", basePrice: 31500, durationDays: 5, featured: true,
    description: "A Kerala route through Kochi, Munnar, Thekkady and Alappuzha, balancing tea-country scenery, spice-country experiences and the backwaters. The itinerary follows a practical route used by Kerala travel operators.",
    images: [image("photo-1602216056096-3b40cc0c9944")], tags: ["Kerala", "Munnar", "Thekkady", "Alappuzha", "backwaters"],
    itinerary: [
      itineraryDay(1, "Kochi to Munnar", "Drive through the Western Ghats and settle into Munnar.", image("photo-1602216056096-3b40cc0c9944", 1000), "Munnar tea country", "Munnar is known for tea plantations and cool mountain landscapes."),
      itineraryDay(2, "Munnar sightseeing", "A day for the familiar tea-valley viewpoints, planned around weather and access.", image("photo-1464822759023-fed622ff2c3b", 1000), "Mattupetty and Echo Point", "Popular Munnar area viewpoints and lake-side stops."),
      itineraryDay(3, "Munnar to Thekkady", "Travel to Thekkady with optional spice-garden and local experiences.", image("photo-1516026672322-bc52d61a55d5", 1000), "Thekkady", "A hill-and-forest gateway associated with Periyar and spice plantations."),
      itineraryDay(4, "Alappuzha backwaters", "Continue to Alappuzha for an unhurried backwater experience.", image("photo-1602309113731-5f3f1e8b8f0d", 1000), "Alappuzha backwaters", "A network of canals, lagoons and village waterways."),
      itineraryDay(5, "Kochi departure", "Return to Kochi for your onward journey.", image("photo-1602216056096-3b40cc0c9944", 1000), "Fort Kochi", "A historic neighbourhood to explore when departure timing allows."),
    ],
  },
  {
    title: "Thailand: Bangkok & Phuket Escape", slug: "thailand-bangkok-phuket-escape", destination: "Thailand", country: "Thailand", category: "Holiday Package", packageType: "Premium", climate: "Tropical", basePrice: 54900, durationDays: 5, featured: true,
    description: "A Thailand holiday combining Bangkok’s urban energy with Phuket’s coast, local food and cultural sites. The mix of days can be tailored to flight timing and your preferred pace.",
    images: [image("photo-1528181304800-259b08848526")], tags: ["Thailand", "Bangkok", "Phuket", "beach holiday"],
    itinerary: [
      itineraryDay(1, "Arrive in Bangkok", "Arrival transfer and a relaxed first evening.", image("photo-1528181304800-259b08848526", 1000), "Bangkok", "Thailand’s capital combines temples, markets, food and riverfront areas."),
      itineraryDay(2, "Bangkok city day", "Select cultural and riverside stops based on opening times and personal interests.", image("photo-1528181304800-259b08848526", 1000), "Bangkok temples and riverfront", "Visits are planned around current operating hours and local guidance."),
      itineraryDay(3, "Fly to Phuket", "Transfer to Phuket and settle into the island pace.", image("photo-1507525428034-b723cf961d3e", 1000), "Phuket coast", "A beach destination with coastal viewpoints and local neighbourhoods."),
      itineraryDay(4, "Phuket discovery", "Choose a beach day, island excursion or Phuket Old Town programme.", image("photo-1507525428034-b723cf961d3e", 1000), "Phuket Old Town", "A historic district known for Sino-European architecture and local cafés."),
      itineraryDay(5, "Departure", "Transfer to the airport according to your confirmed flight.", image("photo-1507525428034-b723cf961d3e", 1000), "Phuket", "Final leisure time is subject to departure timing."),
    ],
  },
  {
    title: "Malaysia Highlights: Kuala Lumpur & Langkawi", slug: "malaysia-kuala-lumpur-langkawi", destination: "Malaysia", country: "Malaysia", category: "Holiday Package", packageType: "Premium", climate: "Tropical", basePrice: 45900, durationDays: 5, featured: false,
    description: "A Malaysia holiday that pairs Kuala Lumpur’s city landmarks with Langkawi’s beaches and island atmosphere. The itinerary leaves room to tailor attractions after travel dates are confirmed.",
    images: [image("photo-1596422846543-75c6fc197f07")], tags: ["Malaysia", "Kuala Lumpur", "Langkawi", "city and beach"],
    itinerary: [
      itineraryDay(1, "Arrive in Kuala Lumpur", "Arrival transfer and time to settle in.", image("photo-1596422846543-75c6fc197f07", 1000), "Kuala Lumpur skyline", "Malaysia’s capital is known for its modern skyline and diverse food scene."),
      itineraryDay(2, "Kuala Lumpur city exploration", "A flexible city day with landmarks and neighbourhoods selected to suit your interests.", image("photo-1596422846543-75c6fc197f07", 1000), "Petronas Towers area", "Visit plans depend on confirmed ticket availability and operating hours."),
      itineraryDay(3, "Continue to Langkawi", "Travel to Langkawi and enjoy an easy coastal evening.", image("photo-1507525428034-b723cf961d3e", 1000), "Langkawi", "An island destination known for beaches, forested landscapes and sea views."),
      itineraryDay(4, "Langkawi at leisure", "Choose a cable-car, mangrove or beach-focused day based on weather and availability.", image("photo-1507525428034-b723cf961d3e", 1000), "Langkawi island experiences", "Outdoor activities depend on weather and the selected operator."),
      itineraryDay(5, "Departure", "Airport transfer according to your onward flight.", image("photo-1596422846543-75c6fc197f07", 1000), "Kuala Lumpur or Langkawi airport", "Departure routing is finalised with the confirmed flight plan."),
    ],
  },
  {
    title: "Bali Honeymoon: Ubud & Uluwatu", slug: "bali-honeymoon-ubud-uluwatu", destination: "Bali", country: "Indonesia", category: "Honeymoon", packageType: "Premium", climate: "Tropical", basePrice: 62900, durationDays: 6, featured: true,
    description: "A Bali honeymoon designed around Ubud’s inland culture and Uluwatu’s clifftop coast, with private time built into the itinerary. Experiences are confirmed around your travel dates and preferred stay style.",
    images: [image("photo-1537996194471-e657df975ab4")], tags: ["Bali", "honeymoon", "Ubud", "Uluwatu"],
    itinerary: [
      itineraryDay(1, "Bali arrival and Ubud", "Private arrival transfer into the Ubud area.", image("photo-1537996194471-e657df975ab4", 1000), "Ubud", "An inland Bali centre for art, rice landscapes and wellness experiences."),
      itineraryDay(2, "Ubud at your pace", "Choose rice-terrace, temple, art or wellness experiences.", image("photo-1537996194471-e657df975ab4", 1000), "Ubud countryside", "Exact stops are selected around your interests and local conditions."),
      itineraryDay(3, "Ubud leisure day", "A slower day for a couple’s spa, cafés or a private local activity.", image("photo-1537996194471-e657df975ab4", 1000), "Bali wellness", "Wellness experiences are arranged on request and subject to availability."),
      itineraryDay(4, "Transfer to Uluwatu", "Travel south to the clifftop coast.", image("photo-1537996194471-e657df975ab4", 1000), "Uluwatu coast", "A coastal area known for cliffside views and sunset settings."),
      itineraryDay(5, "Coastal Bali", "Private beach time and an optional cultural evening.", image("photo-1537996194471-e657df975ab4", 1000), "Uluwatu Temple area", "Visits follow local rules, dress requirements and operating hours."),
      itineraryDay(6, "Departure", "Private transfer to the airport based on your flight schedule.", image("photo-1537996194471-e657df975ab4", 1000), "Ngurah Rai area", "Final timing is planned around your departure flight."),
    ],
  },
  {
    title: "Lakshadweep Island Honeymoon", slug: "lakshadweep-island-honeymoon", destination: "Lakshadweep", country: "India", category: "Honeymoon", packageType: "Premium", climate: "Tropical", basePrice: 57500, durationDays: 5, featured: false,
    description: "A relaxed Lakshadweep honeymoon centred on lagoon time, coral-island scenery and unhurried coastal days. Island entry, transport and water activities are arranged only after permits, weather and local operator availability are confirmed.",
    images: [image("photo-1544551763-46a013bb70d5")], tags: ["Lakshadweep", "honeymoon", "island", "lagoon"],
    itinerary: [
      itineraryDay(1, "Arrival and island transfer", "Complete the confirmed arrival and island-transfer process.", image("photo-1544551763-46a013bb70d5", 1000), "Lakshadweep lagoons", "Island access and transfers follow the confirmed permit and operator plan."),
      itineraryDay(2, "Lagoon leisure", "A relaxed day by the lagoon with time for the beach.", image("photo-1544551763-46a013bb70d5", 1000), "Coral-island shoreline", "Respect local guidance for reef and coastal areas."),
      itineraryDay(3, "Water activity options", "Choose available snorkelling or glass-bottom boat options.", image("photo-1544551763-46a013bb70d5", 1000), "Marine experiences", "All water activities depend on weather, permits and operator safety decisions."),
      itineraryDay(4, "Private island day", "Keep the day open for a slow honeymoon pace.", image("photo-1544551763-46a013bb70d5", 1000), "Island leisure", "Final experiences are confirmed locally."),
      itineraryDay(5, "Departure", "Return transfer in line with your confirmed travel plan.", image("photo-1544551763-46a013bb70d5", 1000), "Island departure", "Timing depends on the approved transport schedule."),
    ],
  },
  {
    title: "Kashmir Honeymoon: Srinagar, Gulmarg & Pahalgam", slug: "kashmir-honeymoon-srinagar-gulmarg-pahalgam", destination: "Kashmir", country: "India", category: "Honeymoon", packageType: "Premium", climate: "Cool", basePrice: 38900, durationDays: 5, featured: false,
    description: "A Kashmir honeymoon through Srinagar, Gulmarg and Pahalgam, paced for scenic drives, valley time and relaxed evenings. Local road, weather and authority conditions always guide the final daily route.",
    images: [image("photo-1595815771614-ade9d652a65d")], tags: ["Kashmir", "honeymoon", "Srinagar", "Gulmarg", "Pahalgam"],
    itinerary: [
      itineraryDay(1, "Arrive in Srinagar", "Arrival assistance and a gentle first evening in Srinagar.", image("photo-1595815771614-ade9d652a65d", 1000), "Srinagar", "A Kashmir valley city associated with Dal Lake, gardens and mountain views."),
      itineraryDay(2, "Srinagar and Dal Lake", "Plan gardens, local heritage and the lake around weather and timing.", image("photo-1595815771614-ade9d652a65d", 1000), "Dal Lake", "Lake activities are selected with local conditions and operator availability in mind."),
      itineraryDay(3, "Gulmarg day trip", "Travel to Gulmarg for meadows and mountain scenery.", image("photo-1595815771614-ade9d652a65d", 1000), "Gulmarg", "Gondola and other activities require separate availability and weather checks."),
      itineraryDay(4, "Pahalgam valley", "A scenic valley day with a flexible return to Srinagar.", image("photo-1595815771614-ade9d652a65d", 1000), "Pahalgam", "Exact route and roadside stops follow current local guidance."),
      itineraryDay(5, "Departure", "Airport transfer according to your confirmed flight.", image("photo-1595815771614-ade9d652a65d", 1000), "Srinagar departure", "Transfer timing is set against the flight schedule."),
    ],
  },
  {
    title: "Delhi Heritage & Culture Holiday", slug: "delhi-heritage-culture-holiday", destination: "Delhi", country: "India", category: "Holiday Package", packageType: "Standard", climate: "Moderate", basePrice: 18900, durationDays: 3, featured: false,
    description: "A short Delhi holiday for travellers who want to explore the city’s layered heritage, major monuments, food and markets. The final route is adjusted around monument closures, traffic and your arrival time.",
    images: [image("photo-1587474260584-136574528ed5")], tags: ["Delhi", "heritage", "culture", "city break"],
    itinerary: [
      itineraryDay(1, "Arrive in Delhi", "Arrival transfer and time to settle in before an evening in the city.", image("photo-1587474260584-136574528ed5", 1000), "India Gate area", "A central Delhi landmark and public space best enjoyed around current access conditions."),
      itineraryDay(2, "Old and New Delhi", "A flexible heritage day with key monuments and market areas selected around operating hours.", image("photo-1587474260584-136574528ed5", 1000), "Humayun’s Tomb and Qutb Minar", "Both are established heritage landmarks; admission and closure schedules are checked before the visit."),
      itineraryDay(3, "Departure", "Optional final neighbourhood visit before airport or station transfer.", image("photo-1587474260584-136574528ed5", 1000), "Delhi markets and museums", "The final stop depends on departure timing and weekly closures."),
    ],
  },
];

await mongoose.connect(process.env.MONGODB_URI, { bufferCommands: false, maxPoolSize: 4 });
try {
  const registry = mongoose.connection.useDb(process.env.PLATFORM_DATABASE || "travels_platform").db;
  const business = await registry.collection("businesses").findOne({ slug: "voibee", status: "active" });
  if (!business) throw new Error("The active Voibee business was not found.");
  if (business.databaseName !== "TRAVELPORTAL_PROD") throw new Error(`Refusing to seed ${business.databaseName}; expected TRAVELPORTAL_PROD.`);

  const db = mongoose.connection.useDb(business.databaseName).db;
  const now = new Date();
  const munnarResult = await db.collection("trips").updateOne(
    { slug: "munnar-stranger-to-friends-weekend" },
    { $set: { ...munnarUpdate, updatedAt: now } },
  );
  if (!munnarResult.matchedCount) throw new Error("Munnar Social Escape was not found; no package was changed.");

  let created = 0;
  for (const item of packages) {
    const startDate = new Date("2026-11-01T00:00:00.000Z");
    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + item.durationDays - 1);
    const result = await db.collection("trips").updateOne(
      { slug: item.slug },
      {
        $setOnInsert: {
          ...item,
          holidayPackage: true,
          supplierPackage: false,
          supplier: null,
          fixedPrice: false,
          totalSeats: 0,
          availableSeats: 0,
          startDate,
          endDate,
          pickupLocation: "Airport / railway station",
          departureCities: ["Kochi", "Bengaluru", "Mumbai"],
          includedServices: ["hotels", "sightseeing", "meals", "transportation"],
          inclusions: ["Accommodation as selected at confirmation", "Daily breakfast", "Airport or railway-station transfers as selected", "Private or shared local transport as selected", "Sightseeing listed in the confirmed itinerary"],
          exclusions: standardExclusions,
          status: "active",
          rating: 0,
          reviewCount: 0,
          createdAt: now,
          updatedAt: now,
        },
      },
      { upsert: true },
    );
    created += result.upsertedCount;
  }

  const rows = await db.collection("trips")
    .find({ slug: { $in: ["munnar-stranger-to-friends-weekend", ...packages.map((item) => item.slug)] } })
    .project({ title: 1, slug: 1, destination: 1, category: 1, status: 1, holidayPackage: 1, fixedPrice: 1, durationDays: 1, basePrice: 1, "itinerary.highlights": 1, "itinerary.specials": 1 })
    .sort({ destination: 1, title: 1 })
    .toArray();
  console.log(JSON.stringify({ productionDatabase: business.databaseName, munnarUpdated: munnarResult.modifiedCount === 1, packagesCreated: created, packagesAlreadyPresent: packages.length - created, packages: rows }, null, 2));
} finally {
  await mongoose.disconnect();
}

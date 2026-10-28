import fs from "node:fs";
import mongoose from "mongoose";

const apply = process.argv.includes("--apply");
const envFile = new URL("../.env.prod", import.meta.url);
for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z0-9_]+)=(.*)$/);
  if (match) process.env[match[1]] = match[2].replace(/^"|"$/g, "");
}

if (!process.env.MONGODB_URI || !process.env.PLATFORM_DATABASE) {
  throw new Error(".env.prod must define MONGODB_URI and PLATFORM_DATABASE.");
}

// Explicit allow-list: platform registry/admin collections are deliberately
// excluded even if a legacy tenant database happens to contain a copy.
const tenantCollections = [
  "users", "partners", "trips", "partnertrips", "bookings", "payments",
  "commissions", "reviews", "wishlists", "notifications", "settings",
  "destinations", "offercards", "employees", "suppliers", "inventoryassets",
  "hotels", "vehicles", "campaigns", "payrolls", "quotations", "leads",
  "visaapplications", "tickettrackings", "hotelreservations", "expenses",
  "invoices", "reputations", "attendances", "attendanceregularizations",
  "performancereviews", "leaverequests", "hrtasks", "activitytypes",
  "activities", "activitybookings",
];

function normaliseLegacyPhone(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return null;
  return String(value).trim().startsWith("+") ? `+${digits}` : `+91${digits}`;
}

await mongoose.connect(process.env.MONGODB_URI, { bufferCommands: false, maxPoolSize: 6 });
try {
  const platform = mongoose.connection.useDb(process.env.PLATFORM_DATABASE).db;
  const businesses = await platform.collection("businesses").find({ status: "active" }).toArray();
  const summary = [];

  for (const business of businesses) {
    if (!business.databaseName) throw new Error(`Business ${business.slug ?? business._id} has no databaseName.`);
    const db = mongoose.connection.useDb(business.databaseName).db;
    const available = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map(({ name }) => name));
    const operations = [];
    for (const collection of tenantCollections) {
      if (!available.has(collection)) continue;
      const missing = await db.collection(collection).countDocuments({ businessId: { $exists: false } });
      if (missing) {
        operations.push({ collection, missingBusinessId: missing });
        if (apply) await db.collection(collection).updateMany({ businessId: { $exists: false } }, { $set: { businessId: business._id } });
      }
    }

    const users = db.collection("users");
    const legacyUsers = available.has("users")
      ? await users.find({ mobile: { $exists: true }, $or: [{ phone: { $exists: false } }, { phone: "" }] }, { projection: { _id: 1, mobile: 1, countryCode: 1 } }).toArray()
      : [];
    for (const user of legacyUsers) {
      const phone = normaliseLegacyPhone(user.mobile);
      if (!phone) continue;
      if (apply) await users.updateOne({ _id: user._id }, { $set: { phone, countryCode: user.countryCode || (phone.startsWith("+91") ? "+91" : "") }, $unset: { mobile: "" } });
    }

    const owner = available.has("users")
      ? await users.findOne({ role: "tenant", businessId: business._id }, { projection: { _id: 1 } })
      : null;
    if (!owner) throw new Error(`No tenant-owner user found for ${business.slug ?? business._id}; refusing to migrate registry record.`);

    const registryUpdate = {
      ownerId: business.ownerId || owner._id,
      businessEmail: business.businessEmail || business.email || "",
      businessPhone: business.businessPhone || business.mobile || "",
      address: business.address || business.adrress || "",
    };
    // Keep legacy fields temporarily. Production still has a unique index on
    // `email`; unsetting it would turn both missing values into `null` and
    // violate that index. The canonical values above are what the app reads.
    if (apply) await platform.collection("businesses").updateOne({ _id: business._id }, { $set: registryUpdate });
    summary.push({ slug: business.slug, database: business.databaseName, collectionUpdates: operations, legacyUsersMigrated: legacyUsers.length, ownerId: String(owner._id) });
  }

  console.log(JSON.stringify({ mode: apply ? "applied" : "dry-run", businesses: summary }, null, 2));
} finally {
  await mongoose.disconnect();
}

import fs from "node:fs";
import mongoose from "mongoose";

for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
  if (match && !process.env[match[1]]) {
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

const { MONGODB_URI, PLATFORM_DATABASE = "travels_platform", VOIBEE_DATABASE, VOIBEE_PORTAL_HOST, VOIBEE_SITE_URL } = process.env;
if (!MONGODB_URI || !VOIBEE_DATABASE || !VOIBEE_PORTAL_HOST || !VOIBEE_SITE_URL) {
  throw new Error("Configure MONGODB_URI, VOIBEE_DATABASE, VOIBEE_PORTAL_HOST and VOIBEE_SITE_URL.");
}

await mongoose.connect(MONGODB_URI, { bufferCommands: false, maxPoolSize: 3 });
try {
  const platform = mongoose.connection.useDb(PLATFORM_DATABASE);
  const businesses = platform.collection("businesses");
  await businesses.createIndex({ slug: 1 }, { unique: true });
  await businesses.createIndex({ databaseName: 1 }, { unique: true });
  await businesses.createIndex({ hosts: 1 }, { unique: true });
  const localHosts = VOIBEE_PORTAL_HOST.includes("localhost")
    ? [VOIBEE_PORTAL_HOST, "localhost:3001", "127.0.0.1:3001"]
    : [VOIBEE_PORTAL_HOST];
  const result = await businesses.updateOne(
    { slug: "voibee" },
    {
      $setOnInsert: {
        name: "Voibee Holidays",
        slug: "voibee",
        databaseName: VOIBEE_DATABASE,
        hosts: [...new Set(localHosts)],
        siteUrl: VOIBEE_SITE_URL,
        logoUrl: `${VOIBEE_SITE_URL.replace(/\/$/, "")}/voibee-logo-with-name.png`,
        primaryColor: "#0060e6",
        status: "active",
        provisioned: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { upsert: true },
  );
  const business = await businesses.findOne(
    { slug: "voibee" },
    { projection: { slug: 1, databaseName: 1, status: 1, hosts: 1 } },
  );
  console.log(JSON.stringify({ inserted: result.upsertedCount === 1, business }, null, 2));
} finally {
  await mongoose.disconnect();
}

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
// Run with: node --env-file=.env.local scripts/bootstrap-platform.mjs
const { MONGODB_URI, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD, VOIBEE_DATABASE, VOIBEE_PORTAL_HOST, VOIBEE_SITE_URL } = process.env;
if (!MONGODB_URI || !SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PASSWORD || SUPER_ADMIN_PASSWORD.length < 12) throw new Error('Set MONGODB_URI, SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD (12+ characters).');
await mongoose.connect(MONGODB_URI);
try {
 const db = mongoose.connection.useDb(process.env.PLATFORM_DATABASE || 'travels_platform');
 await db.collection('platformadmins').createIndex({ email: 1 }, { unique: true });
 await db.collection('platformadmins').updateOne({ email: SUPER_ADMIN_EMAIL.toLowerCase() }, { $setOnInsert: { name: 'Platform owner', password: await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12), createdAt: new Date() } }, { upsert: true });
 if (VOIBEE_DATABASE) {
  if (!VOIBEE_PORTAL_HOST || !VOIBEE_SITE_URL) throw new Error('Set VOIBEE_PORTAL_HOST and VOIBEE_SITE_URL.');
  if (VOIBEE_DATABASE === db.name) throw new Error('Agency and platform databases must differ.');
  await db.collection('businesses').createIndex({ slug: 1 }, { unique: true });
  await db.collection('businesses').createIndex({ databaseName: 1 }, { unique: true });
  await db.collection('businesses').createIndex({ hosts: 1 }, { unique: true });
  await db.collection('businesses').updateOne({ slug: 'voibee' }, { $setOnInsert: { name: 'Voibee Holidays', slug: 'voibee', databaseName: VOIBEE_DATABASE, hosts: [VOIBEE_PORTAL_HOST.toLowerCase()], siteUrl: VOIBEE_SITE_URL, logoUrl: `${VOIBEE_SITE_URL.replace(/\/$/, '')}/voibee-logo-with-name.png`, primaryColor: '#0060e6', status: 'active', provisioned: true, createdAt: new Date() } }, { upsert: true });
 }
 console.log('Platform owner provisioned. Existing agency records were not modified.');
} finally { await mongoose.disconnect(); }

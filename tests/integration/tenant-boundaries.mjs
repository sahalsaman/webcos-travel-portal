import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, createWriteStream } from 'node:fs';
import { once } from 'node:events';
import path from 'node:path';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Runs only on an isolated, temporary MongoDB instance. Never reads a deployment database URI.
const root = process.cwd();
const port = 4381;
const sitePort = 4382;
const base = `http://127.0.0.1:${port}`;
const siteBase = `http://127.0.0.1:${sitePort}`;
const logDirectory = '/tmp/travels-portal-integration';
mkdirSync(logDirectory, { recursive: true });
const children = [];
const mongo = await MongoMemoryServer.create({ instance: { dbName: 'integration_connection' } });
try {
  await mongoose.connect(mongo.getUri());
  const platform = mongoose.connection.useDb('integration_platform');
  const password = 'Temporary-test-password-42!';
  const passwordHash = await bcrypt.hash(password, 4);
  const ownerId = new mongoose.Types.ObjectId();
  await platform.collection('platformadmins').insertOne({ _id: ownerId, name: 'Owner', email: 'owner@example.test', password: passwordHash });
  const businesses = {};
  for (const slug of ['alpha', 'beta']) {
    const id = new mongoose.Types.ObjectId();
    businesses[slug] = id;
    await platform.collection('businesses').insertOne({ _id: id, name: slug, slug, databaseName: `integration_${slug}`, hosts: [`${slug}.localhost:${port}`], siteUrl: siteBase, logoUrl: '', primaryColor: '#0060e6', status: 'active', provisioned: true });
    const db = mongoose.connection.useDb(`integration_${slug}`);
    await db.collection('users').insertOne({ name: slug, email: 'admin@example.test', password: passwordHash, role: 'vendor' });
    await db.collection('users').insertOne({ name: `${slug} traveler`, email: 'traveler@example.test', password: passwordHash, role: 'vendor_traveler' });
    await db.collection('trips').insertOne({ title: `${slug} trip`, slug: 'same-slug', status: 'active', images: [], basePrice: 100, category: 'Family', createdAt: new Date() });
    await db.collection('settings').insertOne({ key: 'global', defaultCommission: slug === 'alpha' ? 100 : 200 });
  }
  function start(cwd, serverPort, extra, label) {
    const log = createWriteStream(`${logDirectory}/${label}.log`);
    const child = spawn(process.execPath, [path.join(cwd, 'node_modules/next/dist/bin/next'), 'start', '--port', String(serverPort)], {
      cwd, env: { ...process.env, MONGODB_URI: mongo.getUri(), PLATFORM_DATABASE: 'integration_platform', AUTH_SECRET: 'isolated-integration-secret-012345678901234567890', AUTH_URL: '', BUSINESS_PAYMENT_CREDENTIALS: '{}', ...extra }, stdio: ['ignore', 'pipe', 'pipe'],
    });
    child.stdout.pipe(log); child.stderr.pipe(log); children.push(child); return child;
  }
  const portalChild = start(root, port, {}, 'portal');
  start(path.resolve(root, '../voibee'), sitePort, { PORTAL_API_URL: base, PORTAL_BUSINESS_SLUG: 'alpha', NEXT_PUBLIC_PORTAL_URL: base }, 'website');
  async function ready(url) {
    for (let attempt = 0; attempt < 120; attempt++) {
      try { if ((await fetch(url + '/api/auth/csrf')).ok) return; } catch {}
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    throw new Error(`Server failed to start: ${url}. See ${logDirectory}`);
  }
  await Promise.all([ready(base), ready(siteBase)]);
  class Client {
    constructor(url, slug) { this.url = url; this.slug = slug; this.cookies = new Map(); }
    async request(route, options = {}) {
      const response = await fetch(this.url + route, { redirect: 'manual', ...options, headers: { ...(this.slug ? { 'x-business-slug': this.slug } : {}), cookie: [...this.cookies].map(([k,v]) => `${k}=${v}`).join('; '), ...options.headers } });
      for (const cookie of response.headers.getSetCookie()) { const part = cookie.split(';')[0]; const i = part.indexOf('='); this.cookies.set(part.slice(0,i), part.slice(i+1)); }
      return response;
    }
    async json(route, options) {
      const response = await this.request(route, options);
      const contentType = response.headers.get('content-type') || '';
      const body = contentType.includes('application/json') ? await response.json() : await response.text();
      return { status: response.status, body };
    }
    async login(email) {
      const csrf = await this.json('/api/auth/csrf');
      const response = await this.request('/api/auth/callback/credentials', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Auth-Return-Redirect': '1' }, body: new URLSearchParams({ email, password, csrfToken: csrf.body.csrfToken, callbackUrl: this.url }) });
      assert.equal(response.status, 200, await response.text());
      return (await this.json('/api/auth/session')).body;
    }
  }
  const alpha = new Client(base, 'alpha'); const beta = new Client(base, 'beta'); const owner = new Client(base);
  assert.equal((await alpha.login('admin@example.test')).user.role, 'vendor');
  assert.equal((await alpha.json('/api/auth/session')).body.user.businessId, String(businesses.alpha));
  assert.equal((await beta.login('admin@example.test')).user.businessId, String(businesses.beta));
  assert.equal((await owner.login('owner@example.test')).user.role, 'admin');
  assert.equal((await alpha.json('/api/platform/businesses')).status, 403);
  assert.equal((await new Client(base, 'alpha').json('/api/admin/settings')).status, 401);
  const crossSession = await alpha.json('/api/auth/session', { headers: { 'x-business-slug': 'beta' } });
  assert.ok(!crossSession.body.user, 'An alpha session must not authenticate to beta');
  assert.equal((await alpha.json('/api/admin/settings', { headers: { 'x-business-slug': 'beta' } })).status, 401);
  const patch = await alpha.json('/api/admin/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ defaultCommission: 321 }) });
  assert.equal(patch.status, 200);
  assert.equal((await beta.json('/api/admin/settings')).body.data.defaultCommission, 200);
  assert.equal((await alpha.json('/api/admin/settings')).body.data.defaultCommission, 321);
  const rpc = (client, operation, args = []) => client.json('/api/storefront', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ operation, args }) });
  assert.equal((await rpc(alpha, 'getTrips')).body.data.items[0].title, 'alpha trip');
  assert.equal((await rpc(beta, 'getTrips')).body.data.items[0].title, 'beta trip');
  assert.equal((await rpc(new Client(base, 'alpha'), 'getTravelerBookings', ['arbitrary-user'])).status, 401);
  assert.equal((await rpc(alpha, 'getAdminStats')).status, 404);
  assert.equal((await rpc(alpha, 'getTrips', [{ pageSize: 100000 }])).status, 422);
  const created = await owner.json('/api/platform/businesses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Gamma Agency', slug: 'gamma', host: `gamma.localhost:${port}`, siteUrl: siteBase, adminName: 'Gamma Admin', adminEmail: 'gamma@example.test', adminPassword: password }) });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const gamma = new Client(base, 'gamma');
  assert.equal((await gamma.login('gamma@example.test')).user.role, 'vendor');
  assert.equal((await rpc(gamma, 'getTrips')).body.data.items.length, 0);
  // Test real same-origin website rewrites, Auth.js cookies, and server-rendered session access.
  const website = new Client(siteBase);
  assert.equal((await website.login('traveler@example.test')).user.businessId, String(businesses.alpha));
  assert.equal((await rpc(website, 'getTrips')).body.data.items[0].title, 'alpha trip');
  assert.equal((await rpc(website, 'getTrips', [])).status, 200);
  const forged = await website.json('/api/storefront', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-business-slug': 'beta' }, body: JSON.stringify({ operation: 'getTrips', args: [] }) });
  assert.equal(forged.body.data.items[0].title, 'alpha trip', 'Website must overwrite client-supplied business identity');
  assert.equal((await website.request('/traveler')).status, 200);
  const suspend = await owner.json('/api/platform/businesses', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: String(businesses.alpha), status: 'suspended' }) });
  assert.equal(suspend.status, 200);
  assert.ok(!(await alpha.json('/api/auth/session')).body.user);
  assert.equal((await alpha.json('/api/admin/settings')).status, 401);
  portalChild.kill('SIGTERM');
  await once(portalChild, 'exit');
  assert.equal((await website.request('/')).status, 200, 'Public website should degrade gracefully while the portal is unavailable');
  console.log('PASS: agency isolation, settings writes, session binding, super-admin authorization, business onboarding, private RPC authorization, input limits, website proxy login/cookies, header spoofing, server rendering, suspension, and public-site outage fallback.');
} finally {
  for (const child of children) child.kill('SIGTERM');
  await Promise.all(children.map(child => child.exitCode === null ? once(child, 'exit') : Promise.resolve()));
  await mongoose.disconnect(); await mongo.stop();
}

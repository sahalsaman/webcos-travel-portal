# Travels Portal

Shared management application and API server for independent travel agencies. Each agency is a **business**, with its own database, staff, customers, packages, bookings, CRM, quotations, finance, HR, partners, settings and branding. Public websites remain separate applications.

## Run locally

Requires Node 20.19+ and MongoDB. Use `npm ci`, copy `.env.example` to `.env.local`, then configure it. Do not set a global `AUTH_URL`: login must use the current agency/site origin.

```sh
node --env-file=.env.local scripts/bootstrap-platform.mjs
npm run dev -- --port 3001
```

Sign in at `http://localhost:3001/login` with the bootstrap owner credentials. `/super-admin` lets the owner add businesses and activate/suspend them. Each new business needs a unique slug, portal host, website URL, branding, and initial agency administrator. Configure DNS/custom domains to route each portal host to this deployment. For local Voibee use `voibee.localhost:3001`.

Agency administrators sign in on their **agency portal host**, with their agency credentials. They cannot access the super-admin APIs. Platform owners use `/super-admin`; agency access is intentionally a separate login, without implicit impersonation.

## Voibee cutover

1. Back up the existing Voibee database and uploaded `.data/booking-documents` directory.
2. Point `MONGODB_URI` at the existing MongoDB cluster. Set `VOIBEE_DATABASE` to the **exact existing database name**, and set `VOIBEE_PORTAL_HOST` / `VOIBEE_SITE_URL`. Keep the platform database separate.
3. Run the bootstrap command above. It registers the existing database and creates the platform owner using insert-only upserts. It does not copy, delete, or rewrite Voibee records, passwords, or IDs. Existing Voibee staff keep their login credentials.
4. Set `BUSINESS_PAYMENT_CREDENTIALS` with Voibee's existing Razorpay key ID and secret under the `voibee` slug. Add separate entries for future businesses. No credentials means online payments are unavailable; offline bookings still work. Production payments never fall back to mock success.
5. Configure the Voibee website with `PORTAL_API_URL`, `PORTAL_BUSINESS_SLUG=voibee`, and `NEXT_PUBLIC_PORTAL_URL` as shown in its `.env.example`. Keep its existing public URL and WhatsApp setting.
6. Deploy the portal first, then deploy the website. Verify agency login, public packages, a quotation, an offline booking, payment provider sandbox checkout, and staff permissions before routing production traffic.
7. Existing sessions must log in again because new sessions carry a business ID. Remove database, auth, and payment secrets from the website deployment after cutover.
8. New uploads are stored in `.data/booking-documents/<business-id>/`. Copy legacy Voibee uploads into that business directory before retiring the old server. Use a persistent volume; ephemeral/serverless disks are unsuitable for uploads.

The migration is code-complete but deployment/bootstrap is an operator action; neither script nor tests should be run against live data inadvertently. `bootstrap-platform.mjs` is idempotent and will not reset an existing owner's password. Failed onboarding leaves a suspended business for inspection; it does not activate incomplete provisioning.

## Isolation and API contract

`travels_platform` holds only business registry and platform administrators. Agency models use a request-resolved Mongoose connection for the business database. Queries, aggregations, unique indexes, population, settings and writes all stay on that connection. No mutable global "current business" exists. Unknown or suspended businesses fail closed. Tenant-dependent public responses are not globally cached.

The host chooses the business for portal pages. Website API transport supplies `x-business-slug`; this is a routing identifier, **not authorization**. JWT sessions include the immutable registry business ID and are checked against the active business on every session read. Switching that header cannot turn one business's session into another business's login.

The website has no API route handlers and no database models. Browser `/api/*` calls are transported by its Next.js proxy to the portal with a fixed server-configured business slug. Same-origin transport preserves cookies and avoids cross-site cookie dependencies. Server-rendered pages use `/api/storefront`, a validated operation allowlist. Private dashboard operations derive user/partner identity from the session rather than trusting submitted IDs. Public pages/layout/design remain in the website repository.

Custom-domain deployments must preserve the public host/protocol forwarded by a trusted reverse proxy. Serve both apps over HTTPS in production. Do not share cookies across agency domains. Configure payment and upload storage separately for each deployment as above.

## Validation

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

The original business workflow tests live here. Run the same checks in `../voibee`. Database maintenance scripts were moved here from Voibee and require an explicit `BUSINESS_SLUG`; use them only against the intended agency database.

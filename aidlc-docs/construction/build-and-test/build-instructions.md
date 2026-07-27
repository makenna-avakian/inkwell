# Build Instructions

## Prerequisites
- **Build Tool**: Next.js 15.5.4 (Turbopack), Node.js 20+, npm
- **Dependencies**: see `package.json` — key runtime deps: `next`, `react`/`react-dom` 19, `drizzle-orm`, `@neondatabase/serverless`, `next-auth` (Auth.js v5 beta), `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` (R2), `stripe`, `zod`, `bcrypt`
- **Environment Variables** (see `.env.example` for the full list, populated per-unit as each was built):
  - `DATABASE_URL` — Neon Postgres connection string
  - `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` — Auth.js
  - `CRON_SECRET` — protects `/api/cron/cleanup-auth`
  - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` — Cloudflare R2 object storage
  - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `APP_BASE_URL` — Stripe Connect/Checkout (Unit 6)
  - `SENTRY_DSN` — optional
- **System Requirements**: any OS with Node 20+; no special memory/disk requirements for local dev

## Build Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
# fill in real values — see README.md's "Getting Started" and "Stripe test-mode setup" sections
```

### 3. Run Database Migrations
```bash
npm run db:generate
npm run db:migrate
```

### 4. Build All Units
```bash
npm run build
```
This is a single Next.js application (`shareart-frontend`) covering all 6 units — there is no per-unit build step; `src/server/{unit}/` business logic and `src/app/` routes/UI compile together as one app.

### 5. Verify Build Success
- **Expected Output**: `✓ Compiled successfully`, followed by the route manifest (21 routes as of Unit 6 — a mix of static `○` and dynamic `ƒ` routes) and `✓ Generating static pages (21/21)`.
- **Build Artifacts**: `.next/` (not committed — see `.gitignore`).
- **Common Warnings**: none expected; a clean build has zero warnings.

## Troubleshooting

### Build Fails with Dependency Errors
- **Cause**: a dependency declared in `package.json` but not actually installed (this happened with `stripe` during Unit 6 — added to `package.json` in Step 1 of Unit 6's code-generation plan but `npm install` wasn't re-run until code that imported it was tested).
- **Solution**: run `npm install` and confirm the package appears under `node_modules/`.

### Build Fails with Compilation Errors
- **Cause**: most commonly a `z.infer` vs `z.input` mismatch on a Zod schema with `.default()` fields (hit in Unit 4), or a test/mock object missing a field after a schema change in a later unit (hit in Unit 6, when `shopProfiles.stripeConnectAccountId` was added and Unit 2's `shops/service.test.ts` mock needed updating).
- **Solution**: run `npx tsc --noEmit` first — it's faster than a full build and pinpoints the exact file/line.

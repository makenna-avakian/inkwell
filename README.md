# Inkwell

A commission-first marketplace for artists — buyers browse shops, read published commission rules, and request custom work; sellers manage their shop, rules, and incoming requests; payments run through Stripe Connect with escrow-style delayed capture.

This repository (`shareart-frontend`) is the entire application (UI + API) — see [`aidlc-docs/inception/requirements/requirements.md`](aidlc-docs/inception/requirements/requirements.md) for the full architecture decision record. The sibling `shareart-backend` repository has been retired.

Built with the [AI-DLC](aidlc-docs/aidlc-state.md) workflow — see `aidlc-docs/` for the complete requirements, design, and construction history.

## Getting Started

1. Copy `.env.example` to `.env.local` and fill in:
   - `DATABASE_URL` — a Neon Postgres connection string
   - `AUTH_SECRET` — generate with `npx auth secret`
   - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — from a Google Cloud OAuth client
   - `CRON_SECRET` — any long random string (protects the cleanup cron endpoint)
   - `SENTRY_DSN` — optional for local dev
   - `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME` / `R2_PUBLIC_URL` — Cloudflare R2 credentials for shop/portfolio image uploads (see `aidlc-docs/construction/shared-infrastructure.md`)

2. Install dependencies and run migrations:
   ```bash
   npm install
   npm run db:generate
   npm run db:migrate
   ```

3. Run the dev server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Testing

```bash
npm test              # unit + component + property-based tests
npm run test:coverage # with coverage report (80% gate — see aidlc-docs requirements.md NFR-3)
```

Integration tests against a real database (`src/server/auth/repository.test.ts` and similar) are skipped automatically unless `DATABASE_URL` is set to a test database.

## Project Structure

- `src/app/` — routes and UI only
- `src/server/{unit}/` — business logic, repository, and config per unit (e.g. `src/server/auth/`)
- `aidlc-docs/` — the complete AI-DLC requirements/design/construction record for this project

## Current Status

Phase 1 (MVP) is in progress. Units 1-4 (Auth & Accounts; Shops & Commission Rules; Listings; Browse & Discovery) are implemented, including the first public-facing pages (`/gallery`, `/search`, `/shops/[shopId]`); Units 5-6 (Commission Requests & Messaging, Orders & Payments) are not yet built — see [`aidlc-docs/aidlc-state.md`](aidlc-docs/aidlc-state.md) for live progress.

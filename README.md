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
   - `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — from a [Stripe test-mode](https://dashboard.stripe.com/test/apikeys) account; see "Stripe test-mode setup" below
   - `APP_BASE_URL` — e.g. `http://localhost:3000` for local dev; used to build Checkout/Connect redirect URLs

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

## Stripe test-mode setup

Orders & Payments (Unit 6) uses Stripe Connect (Express accounts) and Stripe Checkout, both in test mode for local dev:

1. Create a [Stripe account](https://dashboard.stripe.com/register) (or use an existing one) and switch to test mode.
2. Copy the test **Secret key** from the [API keys page](https://dashboard.stripe.com/test/apikeys) into `STRIPE_SECRET_KEY`.
3. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli) and forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   Copy the webhook signing secret it prints (`whsec_...`) into `STRIPE_WEBHOOK_SECRET`.
4. From `/shop`, click "Set up payments with Stripe" to run through Connect Express onboarding using [Stripe's test data](https://stripe.com/docs/connect/testing) (test SSN, test bank account, etc.) — payouts won't be enabled for a connected account until onboarding is complete, which gates commission acceptance and buy-now listings (BR-2).
5. Use [Stripe's test card numbers](https://stripe.com/docs/testing) (e.g. `4242 4242 4242 4242`) at Checkout.

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

Phase 1 (MVP) construction is complete. All 6 units (Auth & Accounts; Shops & Commission Rules; Listings; Browse & Discovery; Commission Requests & Messaging; Orders & Payments) are implemented — buyers can submit commission requests or buy listed pieces outright, sellers accept/manage the order lifecycle through delivery, and payments run through Stripe Connect with escrow-style delayed capture on the commission path. See [`aidlc-docs/aidlc-state.md`](aidlc-docs/aidlc-state.md) for the full construction history.

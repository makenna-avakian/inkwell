# Infrastructure Design — Unit 6: Orders & Payments

See [shared-infrastructure.md](../../shared-infrastructure.md) for project-wide decisions. This is the first unit to add a genuinely new external service (Stripe).

## Compute
- No dedicated compute — the Stripe webhook Route Handler runs in the same Next.js app on Vercel as every other unit.

## Storage
- `orders`, `processed_webhook_events` tables in the shared Neon database.
- `shop_profiles.stripe_connect_account_id` column addition.

## External Service: Stripe
- **Environment variables**: `STRIPE_SECRET_KEY` (test/live determined by which key is configured — no code branching needed), `STRIPE_WEBHOOK_SECRET` (per-environment, since Stripe issues a distinct signing secret per configured webhook endpoint).
- **Webhook endpoint**: `POST /api/webhooks/stripe`, registered in the Stripe Dashboard (or via the Stripe CLI for local development) to point at each environment's deployed URL (`https://<env>.inkwell.app/api/webhooks/stripe` or the Vercel preview URL for staging).
- **Connect**: Express accounts, platform account is Inkwell's own Stripe account (no separate infrastructure — configured in the Stripe Dashboard, not via IaC).

## Networking
- The webhook endpoint must remain publicly reachable without authentication (Stripe can't authenticate like a signed-in user) — its security is the signature verification (BR-6), not network-level access control.

## Monitoring
- Stripe errors and webhook-processing failures are captured by Sentry (shared-infrastructure.md), same as every other unit.

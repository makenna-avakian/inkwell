# Logical Components — Unit 6: Orders & Payments

## Components Needed
- Postgres tables: `orders`, `processed_webhook_events` (per domain-entities.md), in the shared Neon database.
- Schema addition: `shop_profiles.stripe_connect_account_id`.
- Stripe (external): Connect Express accounts, Checkout Sessions, PaymentIntents (created implicitly by Checkout), Transfers.

## Components Explicitly Not Needed
- No queue/background-job service for webhook processing — Stripe's webhook delivery + our own idempotent handler is sufficient at Phase 1 volume; a webhook Route Handler processes synchronously within the request.
- No circuit breaker (see nfr-design-patterns.md).

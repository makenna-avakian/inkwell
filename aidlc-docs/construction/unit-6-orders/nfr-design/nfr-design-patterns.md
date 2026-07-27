# NFR Design Patterns — Unit 6: Orders & Payments

## Resilience Patterns
- **Stripe calls** (Question 1: A): the Stripe client is configured with `maxNetworkRetries: 1` (SDK-native) rather than the hand-rolled "5s timeout, one retry" wrapper used by Units 1-5 — a deliberate, documented deviation, since Stripe's SDK retry logic is idempotency-key-aware and understands its own transient-vs-permanent error classification better than a generic wrapper could.
- **Postgres queries** in this unit still use the project-wide 5s timeout/one-retry convention (unchanged — only the Stripe-specific calls deviate).
- **Circuit breaking**: not implemented, same rationale as every other single-external-dependency unit at this project's scale.
- **Fail-safe defaults**: any Stripe error during checkout/payout surfaces a generic "payment couldn't be processed, try again" message (SECURITY-09) — raw Stripe error details never reach the client. A failed `payouts_enabled` check fails closed (blocks the action) rather than assuming eligibility.

## Security Patterns
- SECURITY-11: all Stripe-calling code isolated in `src/server/orders/payment.ts` (BR-8).
- Webhook endpoint (`/api/webhooks/stripe`) verifies the signature before any parsing — an invalid signature is rejected with 400 before touching the database (BR-6).
- Idempotency keys (BR-5) mean a network-level retry (whether by the SDK or a genuine client re-submission) can never double-charge or double-transfer.

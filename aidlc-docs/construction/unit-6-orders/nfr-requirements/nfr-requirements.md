# NFR Requirements — Unit 6: Orders & Payments

## Reliability / Correctness
- **Currency** (Question 1: A): USD only for Phase 1 — all `priceCents`/`subtotalCents` fields are USD cents; Stripe handles cross-border settlement for Canadian sellers/buyers on its own end.
- **Payout eligibility** (Question 2: A): `payouts_enabled` checked live against Stripe's Account object at acceptance/checkout time, not cached — see business-rules.md BR-2's update.

## Security
- SECURITY-11: all Stripe-calling code isolated in `src/server/orders/payment.ts` (BR-8).
- SECURITY-05: webhook payloads validated via signature (BR-6) before any parsing/trust.
- Idempotency keys on every payment-mutating call (BR-5).
- No raw card data ever reaches the app (Stripe Checkout is entirely Stripe-hosted).

## Performance
- No new hard latency target — checkout is inherently redirect-based (Stripe's own page latency dominates), and webhook processing has no user-facing latency requirement (it's a background confirmation, not a page render).

## Availability
- Inherits project-wide single-region multi-zone / Backup & Restore DR. Stripe itself has its own independent uptime SLA — a Stripe outage degrades checkout/payouts but shouldn't crash the rest of the app (existing Orders/data remain readable).

## Tech Stack Selection
See [tech-stack-decisions.md](tech-stack-decisions.md).

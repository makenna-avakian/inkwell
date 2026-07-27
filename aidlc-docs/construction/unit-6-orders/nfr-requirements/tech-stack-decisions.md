# Tech Stack Decisions — Unit 6: Orders & Payments

| Concern | Choice | Rationale |
|---|---|---|
| Payments | `stripe` npm SDK | Official SDK; project-wide decision (requirements.md) to use Stripe Connect. |
| Payment UI | Stripe Checkout (hosted redirect) | Functional Design decision — simpler and safer than a custom Elements card form for Phase 1. |
| Currency | USD only | Question 1: A. |
| Webhook verification | Stripe SDK's `stripe.webhooks.constructEvent` with the raw request body + signing secret | Standard, well-supported verification path — no custom signature-checking code. |
| Client initialization | Lazy, same pattern as `db/client.ts` | Importing the payment module must never throw without `STRIPE_SECRET_KEY` set (test environments). |

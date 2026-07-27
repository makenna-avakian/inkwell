# Business Logic Summary — Unit 6: Orders & Payments

## Files
- `src/server/orders/transitions.ts` — pure predicates: `isValidTransition` (order state machine), `hasExactlyOneSource` (BR-1: exactly one of `requestId`/`listingId`), `isCancellable` (BR-4).
- `src/server/orders/payment.ts` — lazy-initialized Stripe client (`stripeClient()`, same pattern as `db/client.ts`'s placeholder fallback); `computeFees` (10% platform fee, no-rounding-leak); `onboardSeller`/`hasPayoutsEnabled` (Stripe Connect Express onboarding); `createCheckoutSession` (destination charge via `transfer_data.destination` + `application_fee_amount`); `captureAndRelease`/`cancelOrderAuthorization` (manual-capture escrow release/void); `retrieveTransferId` (best-effort); `constructWebhookEvent` (signature verification).
- `src/server/orders/repository.ts` — Drizzle queries for `orders` and `processed_webhook_events`; `getShopStripeAccountId`/`setShopStripeAccountId` on `shop_profiles`.
- `src/server/orders/service.ts` — orchestration: `acceptAndCreateOrder` (CommissionLifecycleService — resolves Unit 5's forward dependency by wrapping its `acceptRequest`), `checkout` (CheckoutService — buy-now path), `onboardSellerAction`, `markInProgress`/`submitForReview`/`requestRevision`/`approveDelivery`/`cancelOrder` (guarded state transitions), `getOrder`/`getOrderHistoryForBuyer`/`getOrderHistoryForSeller`, `handleWebhookEvent` (WebhookHandlerService — sole path for server-confirmed payment state, per NFR-4).

## Notable Design Decisions
- **BR-1 runtime assertion**: `createValidatedOrder` wraps `createOrderRow` with a `hasExactlyOneSource` check so the invariant is enforced at runtime, not just structurally guaranteed (and tested-but-unused) at the two call sites.
- **BR-2 fail-closed payouts gate**: `assertPayoutsReady` calls Stripe live (`hasPayoutsEnabled`) rather than trusting a cached flag, so a seller who loses payout eligibility after onboarding is blocked from new orders immediately.
- **Question 2 (B) — cancellation, not refund**: `cancelOrder` void/cancels the Stripe PaymentIntent authorization (nothing was ever captured under the manual-capture escrow model), rather than implementing a Stripe refund flow.
- **NFR-4 reconciliation**: order status only ever flips to `completed` via `approveDelivery` (direct server-to-server Stripe call) or `handleWebhookEvent` (verified webhook) — never from unauthenticated client-side confirmation.
- **BR-7 idempotency**: `handleWebhookEvent` checks `isEventProcessed(event.id)` before doing any work and calls `markEventProcessed` at the end, backed by the `processed_webhook_events` table's unique constraint.

## Tests
- `transitions.test.ts` — exhaustive table-driven check of `isValidTransition` against the documented allowed-edges table (incl. terminal-state checks for `completed`/`cancelled`), PBT-01 for `hasExactlyOneSource`, example tests for `isCancellable`.
- `payment.test.ts` — example test for `computeFees`'s default 10% rate, PBT-01 for the no-rounding-leak invariant (`platformFeeCents + sellerNetCents === subtotalCents`) and the fee-bounds invariant.
- `service.test.ts` — example-based: BR-2 payouts gate rejection, fee-computation-into-checkout-session flow, BR-3 object-level auth rejections on `markInProgress`, invalid-transition rejection, `approveDelivery`'s capture-and-release + completion, BR-4 rejecting cancellation of a `delivered` order, BR-7 idempotent no-op on webhook replay.

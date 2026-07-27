# Business Rules — Unit 6: Orders & Payments

## BR-1: Exactly One Source Per Order
An `Order` has exactly one of `requestId` or `listingId` set — never both, never neither. Enforced at creation time in both `createFromRequest` and `createFromListing`.

## BR-2: Stripe Payout Eligibility Is a Precondition (NFR Requirements Question 2: A)
A shop cannot have its commission requests accepted, nor list buy-now items for purchase, until its owner's connected Stripe account has `payouts_enabled = true` — not merely that `stripeConnectAccountId` is set (onboarding can be started without Stripe having finished verifying the account). Checked at `acceptAndCreateOrder` and `checkout` time, not earlier (a seller can still build their shop/rules/listings before onboarding — only the money-moving step is gated). Requires a live lookup against Stripe's Account object (not cached indefinitely, since `payouts_enabled` can change).

## BR-3: Object-Level Authorization
Every mutation (`markInProgress`, `submitForReview`, `requestRevision`, `approveDelivery`, `cancelOrder`) requires the caller to be the order's buyer or seller, with specific actions restricted further (e.g., only the seller can `markInProgress`/`submitForReview`; only the buyer can `approveDelivery`/`requestRevision`).

## BR-4: Cancellation Window (Question 2: B)
`cancelOrder` is only valid from `'accepted'` or `'in_progress'` — never from `'delivered'` or `'completed'`. Cancelling releases the escrow authorization without ever capturing funds (not a refund of captured money, since none was captured).

## BR-5: Idempotency on All Payment-Mutating Calls
Every Stripe API call that moves money or changes payment state passes an idempotency key derived from the Order id and the specific operation (e.g., `{orderId}-authorize`, `{orderId}-capture`) — prevents double-charges on retry (requirements.md NFR-4).

## BR-6: Webhook Signature Verification Required
`handleStripeWebhook` rejects any payload that doesn't verify against the configured webhook signing secret — no payload is ever trusted without a valid signature (SECURITY rules on webhook trust, requirements.md NFR-4).

## BR-7: Webhook Idempotency
Every processed Stripe event id is recorded in `ProcessedWebhookEvent`; a replayed/duplicate webhook delivery is a no-op, not a double-application of the same state change.

## BR-8: Fee Calculation Isolation (SECURITY-11)
`computeFees` and all Stripe-calling code live in `src/server/orders/payment.ts`, isolated from fulfillment-status logic (`src/server/orders/service.ts`) — payment-critical logic stays in one dedicated module, per SECURITY-11 (also followed by Unit 1's Auth module).

---

## PBT-01: Testable Properties

| Component/Function | Property Category | Property |
|---|---|---|
| `computeFees` | Invariant | For any generated `subtotalCents` and `commissionRatePercent`, `platformFeeCents + sellerNetCents === subtotalCents` (no rounding leak) |
| `computeFees` | Invariant | `platformFeeCents` is always non-negative and never exceeds `subtotalCents` |
| Order status transitions | Invariant | Every transition in the state machine (business-logic-model.md) is exhaustively verified against the allowed edges — no invalid transition is ever accepted |
| BR-1 exactly-one-source | Invariant | For any generated Order creation input, validation accepts if and only if exactly one of `requestId`/`listingId` is present |
| Webhook idempotency (BR-7) | Invariant | Processing the same event id any number of times in sequence results in the Order reaching the same final state as processing it exactly once |

No components lack identifiable properties — CRUD happy paths (order creation's insert, webhook event recording) are covered by example-based tests only (PBT-10). Given this unit's risk level, payment-critical paths (`computeFees`, status transitions, idempotency) are held to the "all critical paths" bar from requirements.md NFR-3's Payments test layer, in addition to PBT.

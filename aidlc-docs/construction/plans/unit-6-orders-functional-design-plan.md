# Functional Design Plan — Unit 6: Orders & Payments

Source: [unit-of-work.md](../../inception/application-design/unit-of-work.md) (Unit 6), [components.md](../../inception/application-design/components.md) (Order, Payment, CommissionLifecycleService, CheckoutService, WebhookHandlerService), stories S-19..S-24 (seller), S-35..S-40 (buyer, including S-36 per unit-of-work-story-map.md's correction). **Final unit of Phase 1** — this resolves Unit 5's forward dependency (accept → Order creation → escrow).

## ⚠️ Gap Found: No Story Triggers a Refund
requirements.md FR-6 promises "refunds and dispute handling," but no story in stories.md actually describes *who* triggers a refund or *when* (no admin unit exists yet — that's Phase 2). Question 2 resolves the Phase 1 scope for this.

## Design Decisions Made Directly (not asked — low ambiguity, documented for the record)
- **Single `orders` table** holds both fulfillment state and Stripe/payment fields (1:1 relationship between an Order and its payment — Application Design's separate "Payment component" is realized as a module (`src/server/orders/payment.ts`), not a separate table).
- **Stripe client initialized lazily**, same pattern as `db/client.ts`'s fix in Unit 2 — importing the payment module must never throw just because `STRIPE_SECRET_KEY` isn't set in a test environment.
- **Idempotency**: every Stripe-mutating call passes an idempotency key (requirements.md NFR-4).
- **Milestone payments**: out of scope per Phase 1 (already decided in requirements.md) — full amount only, single capture.
- **Platform commission**: 10% placeholder, configurable (already decided in requirements.md).

## Execution Checklist

- [x] Resolve Question 1 (Order status pipeline: 3-state vs. 4-state with explicit revision) — A
- [x] Resolve Question 2 (Phase 1 refund scope, given no story currently triggers one) — B
- [x] Generate `aidlc-docs/construction/unit-6-orders/functional-design/business-logic-model.md`
- [x] Generate `aidlc-docs/construction/unit-6-orders/functional-design/business-rules.md` (incl. PBT-01)
- [x] Generate `aidlc-docs/construction/unit-6-orders/functional-design/domain-entities.md`
- [x] Generate `aidlc-docs/construction/unit-6-orders/functional-design/frontend-components.md`

## Questions

## Question 1: Order Status Pipeline
The proposal's full pipeline is "In Progress → Revision → Delivered → Completed." Should `Order.status` model `'revision'` as its own explicit state, or treat a requested revision as simply re-entering `'in_progress'` (with the feedback itself living in the existing Message thread, not a separate status)?

A) 3 states: `in_progress` / `delivered` / `completed` — a revision request moves `delivered` back to `in_progress`; the "this is a revision, not the first pass" context is just visible from the message thread, not a distinct status

B) 4 states, including an explicit `revision` status distinct from `in_progress` — more faithful to the proposal's literal pipeline, more UI/logic to keep in sync

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 2: Phase 1 Refund Scope
No story describes who triggers a refund or when. What should Phase 1 actually support?

A) No refund-trigger UI/flow at all for Phase 1 — the escrow/capture mechanics are built (so refunds are technically possible via Stripe's dashboard directly, since money is held, not captured, until approval), but no in-app "issue a refund" action exists yet; full refund tooling arrives with Phase 2's admin/dispute features

B) A minimal buyer- or seller-triggered "cancel this commission" action while still `in_progress` (before delivery/approval), releasing the escrowed authorization without capturing it — since no capture happened yet, this is a cancellation, not technically a refund

X) Other (please describe after [Answer]: tag below)

[Answer]: b

# Application Design Plan — Inkwell (Phase 1)

Source: [requirements.md](../requirements/requirements.md), [stories.md](../user-stories/stories.md).

## Execution Checklist

- [x] Resolve Question 1 (Order vs. Commission Request boundary) — A: kept distinct
- [x] Resolve Question 2 (Messaging as standalone component) — B: embedded in Commission Request
- [x] Resolve Question 3 (Phase 1 notification scope) — B, then confirmed via clarification as A: small in-app status badge added as FR-8
- [x] Generate `components.md` — component definitions and responsibilities
- [x] Generate `component-methods.md` — method signatures (business rules deferred to Functional Design)
- [x] Generate `services.md` — service definitions and orchestration
- [x] Generate `component-dependency.md` — dependency matrix and data flow
- [x] Generate `application-design.md` — consolidated document
- [x] Validate design completeness and consistency against requirements.md FR-1..FR-8

## Questions

## Question 1: Order vs. Commission Request Boundary
The proposal's data model (requirements.md/proposal §4.3) has `CommissionRequest` (the pre-acceptance negotiation: description, references, budget, status through Requested/Accepted/Declined) and a separate `Order` (the paid transaction record, referencing either a `CommissionRequest` or a `Listing`, tied to a Stripe PaymentIntent). Should Application Design keep these as two distinct components/entities, or merge them into one?

A) Keep them distinct — `CommissionRequest` owns the pre-payment negotiation lifecycle (Requested/Accepted/Declined); a separate `Order` is created at acceptance/purchase time and owns payment state and the post-acceptance status pipeline (In Progress/Revision/Delivered/Completed)

B) Merge them — a single entity carries both the negotiation and the payment/fulfillment state through its entire lifecycle

C) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 2: Messaging as a Standalone Component
Should Messaging be its own component/service (reusable by both the Commission Request flow and, later, any other threaded conversation), or should it be embedded directly inside the Commission Request component with no independent interface?

A) Standalone Messaging component/service, attached to an order/request by ID — cleaner boundary, reusable if messaging is ever needed elsewhere

B) Embedded inside the Commission Request component — simpler for Phase 1, no independent interface

C) Other (please describe after [Answer]: tag below)

[Answer]: b

## Question 3: Phase 1 Notification / Status-Visibility Scope
requirements.md explicitly defers "notifications (email + in-app)" to Phase 2. Story S-35 ("buyer receives notification/sees status change") needs a Phase-1-appropriate interpretation. What should Phase 1 actually provide?

A) In-app only, pull-based — buyers/sellers see current status when they open the request/order view; no push notifications, no email, no dedicated Notification component. Status is just a field on the Order/CommissionRequest entity.

B) In-app, push-based — a lightweight in-app notification/badge system (e.g., unread indicator) is built now, even though email notifications wait for Phase 2

C) Other (please describe after [Answer]: tag below)

[Answer]: a

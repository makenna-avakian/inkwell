# Components — Inkwell (Phase 1)

All components live in a single Next.js codebase (`shareart-frontend`), organized as separate logical modules under `src/lib/` (server-side logic) and `src/app/` (routes/UI), per requirements.md's single-codebase decision. Detailed business logic is deferred to Functional Design (per-unit); this document defines component boundaries and responsibilities only.

## Component: Auth
- **Purpose**: Manage user accounts, sign-in/sign-up, and session state via Auth.js.
- **Responsibilities**: Account creation, session issuance/validation, role assignment (`buyer`/`seller`/`admin`; Phase 1 only actively uses buyer/seller), password/OAuth credential handling delegated to Auth.js.
- **Serves stories**: S-1.
- **NFR notes**: SECURITY-12 (credential management) is fully delegated to Auth.js rather than hand-rolled.

## Component: ShopProfile
- **Purpose**: Represent and manage a seller's public shop.
- **Responsibilities**: Create/edit shop profile (banner, avatar, bio, social links), manage portfolio gallery images, expose the shop's current slot state for display.
- **Serves stories**: S-2, S-3, S-4.

## Component: CommissionRuleSet
- **Purpose**: Own a seller's versioned commission rules — the "structured living document."
- **Responsibilities**: Create/publish/version rule sets; manage pricing tiers and add-ons; manage slot state (open/closed/waitlist) and max queue limit; enforce that a new version doesn't retroactively change rules referenced by existing requests.
- **Serves stories**: S-5, S-6, S-9, S-10, S-11, S-12.
- **Dependencies**: ShopProfile (a rule set belongs to exactly one shop).

## Component: Listing
- **Purpose**: Represent finished-work items available for direct "buy now" purchase.
- **Responsibilities**: Create/edit/remove listings; track sold/available status.
- **Serves stories**: S-13, S-14.
- **Dependencies**: ShopProfile.

## Component: Discovery
- **Purpose**: Read-oriented component powering browse/search/filter across shops and listings.
- **Responsibilities**: Query and present the public gallery feed; apply filters (medium, style, price range, commission availability); shop/artist search.
- **Serves stories**: S-25, S-26, S-27, S-28, S-29.
- **Dependencies**: ShopProfile, CommissionRuleSet (for availability/rules display), Listing (read-only across all — this component does not own any data itself).

## Component: CommissionRequest
- **Purpose**: Own the pre-payment negotiation lifecycle for a custom commission, including its embedded messaging thread (per Application Design Question 2: embedded, not standalone).
- **Responsibilities**: Validate and create a request against the seller's *currently published* rule version; enforce the seller's slot/queue state at submission time; own status transitions `Requested → Accepted` / `Requested → Declined`; own the request's threaded messages; own waitlist entries.
- **Serves stories**: S-15 through S-19 (seller side), S-30 through S-34, S-36 (buyer side).
- **Dependencies**: ShopProfile, CommissionRuleSet.
- **Note**: Once `Accepted`, downstream fulfillment state (`In Progress`/`Revision`/`Delivered`/`Completed`) is owned by Order (Application Design Question 1: kept distinct), not by CommissionRequest — CommissionRequest's own status only spans `Requested`/`Accepted`/`Declined`.

## Component: Order
- **Purpose**: Own the paid transaction and post-acceptance fulfillment lifecycle, for both commission-derived and direct "buy now" orders (per Application Design Question 1: distinct from CommissionRequest).
- **Responsibilities**: Represent a single paid transaction (linked to either a `CommissionRequest` or a `Listing`); own fulfillment status `In Progress → Revision → Delivered → Completed`; own the order's transaction history view; continue to own the request's messaging thread post-acceptance (same embedded thread as CommissionRequest — see Component Dependency doc for how the thread is addressed across both).
- **Serves stories**: S-20, S-21 (seller fulfillment actions), S-35, S-37, S-38, S-39 (buyer purchase/approval/history), S-40 (refunds, jointly with Payment).

## Component: Payment
- **Purpose**: Isolate all payment-processing logic in one place, per SECURITY-11 (security-critical logic must be isolated in dedicated modules, not scattered across the codebase).
- **Responsibilities**: Stripe Connect Express onboarding; create/authorize/capture/refund PaymentIntents; compute and apply the platform commission (configurable, default 10% per requirements.md); process Stripe webhooks (payment state changes **only** via verified webhook events, never client confirmation — NFR-4); trigger seller payouts.
- **Serves stories**: S-22, S-23, S-24 (seller side), S-37, S-38, S-40 (buyer side).
- **Dependencies**: Order (payment state is attached to an Order).
- **NFR notes**: SECURITY-11 (isolation), SECURITY-13/webhook signature verification, idempotency keys on all payment-mutating operations (requirements.md NFR-4).

## Component: StatusBadge
- **Purpose**: Lightweight in-app status/unread indicator (FR-8, added during Application Design clarification).
- **Responsibilities**: Track whether a buyer or seller has unseen status changes or new messages on a request/order; expose an unread count/badge; clear on view. No email delivery, no preferences (out of scope — Phase 2).
- **Serves stories**: S-35 (status-change awareness).
- **Dependencies**: CommissionRequest, Order (reads status/message-thread changes from both).

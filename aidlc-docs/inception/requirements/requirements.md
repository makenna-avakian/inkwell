# Requirements — Inkwell (Phase 1 / MVP)

## Intent Analysis Summary

- **User Request**: Add AI-DLC to `shareart-frontend` and `shareart-backend`, then use it to build a website, based on a full product proposal ("Inkwell" — a commission-first marketplace for artists).
- **Request Type**: New Project (the marketplace itself) built on top of an existing brownfield repo (`shareart-frontend`, currently a personal portfolio site) which will be **replaced**, plus a currently-empty repo (`shareart-backend`) which will be **retired**.
- **Scope Estimate**: System-wide — new data model, new auth, new payments integration, multiple new pages/flows, replacing the entire existing frontend app.
- **Complexity Estimate**: Complex — multi-tenant marketplace, real money movement (Stripe Connect, escrow), RBAC, and three enabled rule extensions (Security Baseline, Resiliency Baseline, Property-Based Testing) enforced as blocking constraints.
- **Depth**: Comprehensive.

## Scope Decision (from clarification round)

This workflow plans and builds **Phase 1 (MVP) only** from the proposal's three-phase roadmap. Phase 2 (Trust & Growth) and Phase 3 (Delight) are explicitly out of scope for this pass and will be planned as a separate, later AI-DLC workflow once Phase 1 ships. This resolves the scope-vs-timeline contradiction identified during clarification (full three-phase scope is not realistic for a weeks-scale, 2-5 person team).

## Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Repo structure | **Single Next.js codebase in `shareart-frontend`** (UI + Server Actions/Route Handlers). `shareart-backend` is retired — no code will be generated there. | User deferred to "whichever is easiest to maintain" for a 2-5 person team; one codebase/one deploy target is lowest-maintenance and matches the proposal's own recommendation. |
| Existing personal site | **Replaced entirely.** No migration of the existing gallery/contact/links content — Makenna's portfolio becomes the first seller shop on Inkwell going forward, built fresh as part of Phase 1. | Explicit user answer (Q1: B). |
| Marketplace model | **Full multi-seller marketplace from the start** (not single-artist-only). | Explicit user answer (Q2: A). |
| Database / ORM | **PostgreSQL + Drizzle ORM** | User deferred to judgment; Drizzle is the proposal's lighter-weight recommendation, consistent with the "easiest to maintain" steer. |
| Authentication | **Auth.js (NextAuth)** | Explicit user answer (Q5: A). |
| Payments | **Stripe Connect (Express accounts)**, escrow-style delayed capture | Explicit user answer (Q6: A), confirming the proposal's recommendation. |
| Checkout flows | **Distinct flows**: direct "buy now" checkout for finished listings (no escrow) vs. commission checkout (accept → capture-on-delivery) | User deferred to judgment; only commissions need the escrow/acceptance pipeline. |
| Platform commission | **Placeholder configurable percentage (default 10%)**, stored as config, not hardcoded, so it can be changed later without a code change | Explicit user answer (Q9: C) — not yet decided as a business matter. |
| Geographic launch scope | **US + Canada** | Explicit user answer (Q11: B). Affects Stripe Connect payout country configuration and (later) tax handling. |
| Content policy | **SFW only** — no mature/NSFW content permitted at launch | Explicit user answer (Q12: A). |
| Team/timeline | Small team (2-5 people), weeks-scale target for Phase 1 | Explicit user answer (Q8: B). |

## Extension Configuration

| Extension | Enabled | Notes |
|---|---|---|
| Security Baseline | **Yes** | All 15 SECURITY rules enforced as blocking constraints from Application Design through Code Generation. |
| Resiliency Baseline | **Yes** | See Resiliency Decisions below for the answers this drives. |
| Property-Based Testing | **Yes, full enforcement** | All 10 PBT rules enforced as blocking constraints (not Partial mode). Applies especially to pricing/fee calculations, commission-rule validation, and order status transitions. |

### Resiliency Decisions (RESILIENCY-02, -03, -08)
- **RTO/RPO & DR strategy**: Backup & Restore (hours-scale RTO/RPO) — lowest cost, appropriate for a pre-launch startup workload. Redeploy from IaC and restore from backup on failure; no standby infrastructure running.
- **Regional topology**: Single-region, multi-zone. Tolerates availability-zone failure; does not survive a full regional outage. Consistent with the Backup & Restore choice.
- **Change management process**: Exempted for now, with rationale: "this is going to be a small startup, we will try different things to see how well everything works" — i.e., the team is intentionally pre-process at this stage. This will be revisited once the team or workload grows.
- **Deferred to NFR Design**: CI/CD tooling, rollback mechanism, deployment style (RESILIENCY-04), incident response process (RESILIENCY-15), and resiliency testing approach (RESILIENCY-14).

## Functional Requirements

Scoped to Phase 1 of the Inkwell proposal (see [inkwell-proposal-source.md](inkwell-proposal-source.md) §3, §7 for full context):

### FR-1: Authentication & Accounts
- Users can sign up / sign in via Auth.js.
- A user can hold both buyer and seller roles simultaneously.
- Roles: buyer, seller, admin.

### FR-2: Seller Shops
- A seller can create and customize a shop page: banner, avatar, bio, social links, portfolio gallery.
- A seller can publish a **commission rule set**: pricing tiers, add-ons (e.g. sketch vs. full color, extra character, rush fee), what they will/won't draw, turnaround expectations, via a structured block-based editor that stores structured data (not just free text).
- A seller can manage **slot state**: open / closed / waitlist, with a queue limit; the shop auto-closes new requests when the queue limit is reached.
- Commission rule sets are **versioned** so a buyer's request always reflects the rules that applied at request time.

### FR-3: Browse & Discover
- Public gallery/feed of listings (both finished work and commission-tier offerings), filterable by medium, style tag, price range, and commission availability.
- Artist search and shop pages function as a mini storefront.

### FR-4: Commission Requests
- A buyer submits a commission request via a form **generated from the seller's published rules**, so a request cannot violate stated terms (e.g., can't request a closed slot or an unsupported tier).
- Request includes: reference image upload, budget, deadline preference, free-text description.
- Threaded messaging per request for back-and-forth (sketches, revisions, approvals).
- Status pipeline: `Requested → Accepted → In Progress → Revision → Delivered → Completed`, with an explicit `Declined` state (with reason) available from `Requested`.

### FR-5: Listings & Direct Purchase
- Sellers can list finished/existing work for direct "buy now" purchase (no commission-request pipeline required).

### FR-6: Payments & Payouts
- Buyers pay into escrow (delayed capture) when a commission request is **accepted**; funds capture and release to the seller (minus platform commission) on delivery/approval.
- Direct "buy now" purchases use a simpler, non-escrow checkout (capture immediately).
- Automated payouts to sellers via Stripe Connect.
- Refunds and basic dispute handling.
- Full transaction history visible to both buyer and seller.
- No raw card data ever touches the application (Stripe Elements/Checkout only).

### FR-7: Trust Signals (Phase 1 subset)
- Response-time and completion-rate stats shown on shop pages (basic version; full review/rating system is Phase 2).

### FR-8: In-App Status Badge (added during Application Design)
- A lightweight in-app unread/status-badge indicator surfaces when a buyer's or seller's request/order status changes, or a new message arrives. No email delivery, no notification preferences, no digest — those remain Phase 2 (see Out of Scope below). Added per Application Design clarification: [application-design-clarification-questions.md](../plans/application-design-clarification-questions.md) (Answer: A).

## Non-Functional Requirements

### NFR-1: Security (Security Baseline — see security-baseline.md for full rule text)
- All 15 SECURITY rules apply as blocking constraints in Application Design, NFR Design, Infrastructure Design, and Code Generation. Particularly load-bearing given real payments and user accounts:
  - SECURITY-08 (application-level access control / RBAC — e.g., only a shop's owner can edit its rules; only an order's buyer/seller can view its messages)
  - SECURITY-12 (authentication & credential management via Auth.js)
  - SECURITY-05 (input validation via a schema library such as Zod)
  - SECURITY-11 (payment-processing logic isolated in dedicated modules)

### NFR-2: Resiliency (Resiliency Baseline — see resiliency-baseline.md for full rule text)
- Single-region, multi-zone deployment; Backup & Restore DR strategy; automated encrypted backups of Postgres data.
- Health checks, timeouts on all external calls (Stripe, DB), and graceful degradation for non-critical dependencies.
- (CI/CD, rollback, deployment style, incident response, and resiliency testing approach are decided at NFR Design, not here.)

### NFR-3: Testing (proposal §6 + Property-Based Testing extension)
- Target ≥80% coverage (branches, functions, lines), enforced in CI.
- Layered strategy: unit (Vitest), component (React Testing Library), integration/API (Vitest + Docker Postgres), E2E (Playwright, top 8-10 flows), payments (Stripe test mode + webhook fixtures).
- Property-based tests (fast-check, per PBT-09) required for: pricing/fee calculations, commission-rule validation logic, and order status transitions — complementing, not replacing, example-based tests (PBT-10).

### NFR-4: Data Integrity & Auditability
- Payment state updates only from verified Stripe webhook events (never client-confirmation alone), with idempotency keys on payment-mutating requests.
- Admin actions (moderation, manual refunds, suspensions) are audit-logged.

## Explicitly Out of Scope (Phase 1)

Deferred to a future Phase 2/3 AI-DLC workflow, per proposal §7: reviews/ratings, search & filtering (beyond basic browse), **email notifications and notification preferences/digests** (a minimal in-app status badge is now in scope — see FR-8), milestone payments, admin moderation tooling, reporting/flagging, reactions/likes, WIP progress reveals, badges/achievements, featured/curated discovery, seller analytics dashboard.

## Traceability

- Source proposal: [inkwell-proposal-source.md](inkwell-proposal-source.md)
- Clarifying questions & answers: [requirement-verification-questions.md](requirement-verification-questions.md), [requirements-clarification-questions.md](requirements-clarification-questions.md), [resiliency-baseline-questions.md](resiliency-baseline-questions.md)
- Existing codebase analysis: [../reverse-engineering/](../reverse-engineering/)

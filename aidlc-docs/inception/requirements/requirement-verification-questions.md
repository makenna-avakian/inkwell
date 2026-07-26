# Requirements Clarification Questions — Inkwell

Please answer by filling in the letter choice after each `[Answer]:` tag. If none of the options match, use the last option ("Other") and describe your answer. Let me know when you're done.

---

## Part 1 — The Big Fork (brownfield vs. new platform)

Reverse Engineering found that `shareart-frontend` is currently a **live, real personal portfolio site** for Makenna Avakian (home page, gallery of her own art, a contact form, a personal-links page) — not a blank template. The Inkwell proposal, on the other hand, describes a **multi-seller marketplace** where many different artists each run their own shop. These are different products, so this needs to be resolved before anything else.

## Question 1
What should happen to the existing personal portfolio site?

A) Evolve it into Inkwell — Makenna becomes the first seller/shop on the new multi-seller marketplace; the existing gallery/contact/links content is migrated into her shop profile

B) Replace it entirely — rebuild `shareart-frontend`/`shareart-backend` from scratch as Inkwell with no attempt to preserve or migrate the existing personal-site content

C) Keep the personal site as-is and build Inkwell as a separate concern (e.g., a different route, subdomain, or you'll tell me the real separation) — describe under Other

X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 2
Is Inkwell meant to be a genuine multi-artist marketplace (many independent sellers, each with their own shop), as the proposal describes — or is the real near-term goal a single-artist commission site (just Makenna) that borrows Inkwell's shop-rules/commission-request/payment ideas but doesn't need multi-tenant seller onboarding yet?

A) Full multi-seller marketplace, as the proposal describes, from the start

B) Single-artist site for now (Makenna only), built so multi-seller could be added later without a rewrite

C) Single-artist site only — no intention to support other sellers, ever

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Part 2 — Architecture (repo split)

## Question 3
You have two separate repos (`shareart-frontend`, `shareart-backend`), but the proposal's recommended stack is a *single* Next.js codebase (frontend + Server Actions/Route Handlers together, no separate backend service). How should this be resolved?

A) Single Next.js codebase — build everything (UI + API) in `shareart-frontend`; leave `shareart-backend` unused/retired

B) Real client/server split — `shareart-frontend` is Next.js UI only; `shareart-backend` is a genuine separate API service (e.g., Node/Express, NestJS, or similar) that the frontend calls over HTTP

C) Hybrid — `shareart-frontend` uses Next.js Server Actions/Route Handlers for simple reads/writes, but payment webhooks, background jobs, etc. live in `shareart-backend` as a separate service

X) Other (please describe after [Answer]: tag below)

[Answer]:  X whichever is easiest to maintain

## Question 4
Which database/ORM combination should be used? (Only matters if you have a preference — otherwise I'll default to the proposal's recommendation: PostgreSQL + Drizzle.)

A) PostgreSQL + Drizzle ORM (proposal's lighter-weight recommendation)

B) PostgreSQL + Prisma ORM (larger ecosystem, more admin tooling)

C) I don't have a preference — use your judgment

X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 5
Which authentication approach should be used?

A) Auth.js (NextAuth) — free, open-source, more auth code to own

B) Clerk — paid/managed, less auth code to secure and test

C) I don't have a preference — use your judgment

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 6
The proposal recommends Stripe Connect (Express accounts) for marketplace payments (seller onboarding, escrow-style delayed capture, automated payouts). Confirm this is the payment approach to build toward.

A) Yes — Stripe Connect as described in the proposal

B) No — use a different payment provider or approach (describe under Other)

C) Not needed yet — build the browsing/commission-request flow first, payments come in a later phase

X) Other (please describe after [Answer]: tag below)

[Answer]:  A

---

## Part 3 — Scope for this engagement

## Question 7
The proposal lays out three phases (Phase 1 MVP, Phase 2 Trust & Growth, Phase 3 Delight). What should THIS AI-DLC workflow actually plan and build right now?

A) Phase 1 (MVP) only — auth, shop creation, commission rules, browse/gallery, commission requests, Stripe Connect + escrow payments, order status, basic messaging

B) Phase 1 + Phase 2 — MVP plus reviews/ratings, search/filtering, notifications, milestone payments, admin moderation

C) All three phases, fully

X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 8
What's the target launch timeline and team size? (Affects how aggressively Workflow Planning sequences the work.)

A) Solo/small side project, no hard deadline — optimize for learning/iteration speed

B) Weeks-scale target with a small team (2-5 people)

C) Months-scale target, larger effort

X) Other (please describe after [Answer]: tag below)

[Answer]: B

---

## Part 4 — Business rules from the proposal's own open questions

## Question 9
What percentage does the platform take on completed sales/commissions?

A) A single flat percentage across all sellers/transactions (tell me the number under Other)

B) Varies by seller tier or transaction size (describe the tiers under Other)

C) Not decided yet — use a placeholder configurable value (e.g. 10%) that can be changed later

X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 10
Should "buy now" purchases of finished work and commissioned-work orders share the same checkout flow, or be kept distinct?

A) Same checkout flow for both

B) Distinct flows (finished-work checkout is simpler/no escrow; commission checkout includes the request/rules pipeline)

C) Not decided yet — use your judgment

X) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 11
What geographic scope should launch target? (Affects Stripe Connect payout countries and tax handling.)

A) US only

B) US + Canada

C) Broader (US + EU/UK, or global) — describe under Other

X) Other (please describe after [Answer]: tag below)

[Answer]: B

## Question 12
What content policy applies to listings (e.g., mature/NSFW art)?

A) SFW only — no mature content allowed at all

B) Mature content allowed but gated (e.g., age-gate + explicit opt-in, tagged and hidden by default)

C) Not decided yet — use your judgment for an MVP-safe default (SFW only) and revisit later

X) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Part 5 — Extension opt-ins

These come from AI-DLC's optional rule extensions. Enabling one makes its rules **blocking constraints** enforced throughout Requirements, Design, and Code Generation for this project; skipping it means those rules aren't loaded/enforced.

## Question: Security Extensions
Should security extension rules be enforced for this project?

A) Yes — enforce all SECURITY rules as blocking constraints (recommended given this project handles real payments and user accounts)

B) No — skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question: Resiliency Extensions
Should the resiliency baseline be applied to this project?

**What this extension is.** Enabling it applies a set of **directional, design-time best practices** for building resilient systems, derived from the **AWS Well-Architected Framework (Reliability Pillar)** and resilience-review guidance. It steers requirements, design, and code toward fault tolerance, high availability, observability, and recoverability.

**What this extension is NOT.** Enabling it does **not** make your workload production-ready, nor does it certify or guarantee any availability, RTO, or RPO target. It is a **starting point**, not a substitute for a formal AWS Well-Architected Review.

A) Yes — apply the resiliency baseline as directional best practices and design-time guidance

B) No — skip the resiliency baseline (suitable for a side project/early-stage product where rapid iteration matters more than reliability)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question: Property-Based Testing Extension
Should property-based testing (PBT) rules be enforced for this project?

A) Yes — enforce all PBT rules as blocking constraints (this project has real business logic: pricing/fee calculations, commission-rule validation, order status transitions)

B) Partial — enforce PBT rules only for pure functions and serialization round-trips

C) No — skip all PBT rules (rely on the unit/integration/E2E test layers described in the proposal instead)

X) Other (please describe after [Answer]: tag below)

[Answer]: A

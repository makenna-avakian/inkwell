# INKWELL — A Commission-First Marketplace for Artists

**Product & Technical Proposal**
Prepared for: m | July 26, 2026

> Source: `Inkwell_Proposal.docx`, converted to Markdown as the source input for AI-DLC Requirements Analysis. Reproduced in full below for traceability.

## 1. Executive Summary

Inkwell is a proposed marketplace and commission platform built for artists — new and established — to sell existing work and take custom commissions directly from buyers. It pairs the browsing experience of a curated storefront with the flexibility of a personal "shop," where each artist sets their own commission rules, pricing tiers, and turnaround expectations, similar in spirit to a living Google Doc that buyers read before requesting work.

The platform is designed to feel playful and interactive rather than transactional — discovery should feel like browsing a gallery, and requesting a commission should feel like starting a conversation, not filling out a support ticket.

**Goals**
- Lower the barrier to selling art. Artists should be able to open a shop, list work, and define commission terms in minutes.
- Make commissioning approachable. Buyers should be able to browse, understand an artist's rules at a glance, and submit a request with reference images and details in one flow.
- Handle money safely. Payments, payouts, and refunds need to be secure, auditable, and compliant without the platform ever touching raw card data.
- Ship something testable. The codebase should carry automated tests sufficient to sustain 80%+ coverage from the first release, not bolted on afterward.

## 2. Target Users

### 2.1 Sellers (Artists)
Range from hobbyists posting their first piece to established artists migrating an existing following. Both need a shop page that represents their brand, a clear way to publish commission rules (slots open/closed, pricing tiers, what they will and won't draw, turnaround time), and a queue to manage incoming requests.

### 2.2 Buyers
Range from casual browsers discovering art for the first time to repeat collectors who commission regularly. They need to browse and filter by style, medium, and price; read an artist's shop rules before committing; submit a commission request with references and budget; and track status from request through delivery.

### 2.3 Platform Operator (You)
Needs visibility into transactions, disputes, and abuse reports, plus tools to moderate listings and collect a platform commission on completed sales without manually intervening in every payout.

## 3. Core Features

### 3.1 Browse & Discover
- Public gallery/feed of listings and portfolio pieces, filterable by medium, style tags, price range, and commission availability.
- Artist search and "shop" pages functioning as a mini storefront (banner, bio, portfolio grid, reviews).
- Featured/curated sections and a "surprise me" discovery mode to keep browsing playful.

### 3.2 Seller Shops
- Customizable shop page: banner, avatar, bio, social links, portfolio gallery.
- Commission rules editor — a structured, block-based editor (headings, lists, price tables, reference images) that reads like a living document but stores structured data underneath, so rules can also drive form validation (e.g. auto-disable requests when slots are closed).
- Slot management: open/closed/waitlist states, queue limits, and auto-close when a seller's queue is full.
- Pricing tiers and add-ons (e.g. sketch vs. full color, extra character, rush fee).

### 3.3 Commission Requests
- Structured request form generated from the seller's published rules (so buyers can't submit requests that violate stated terms).
- Reference image upload, budget field, deadline preference, and free-text description.
- Threaded messaging per request for back-and-forth (sketches, revisions, approvals).
- Status pipeline: Requested → Accepted → In Progress → Revision → Delivered → Completed, with the option for a seller to Decline with a reason.

### 3.4 Payments & Payouts
- Buyers pay up front into escrow (delayed capture) when a commission is accepted; funds release to the seller on delivery/approval, minus platform commission.
- Support for milestone payments on larger commissions (e.g. 50% on acceptance, 50% on delivery).
- Direct "buy now" checkout for existing/finished work (no commission workflow needed).
- Automated payouts to sellers, refunds and dispute handling, and full transaction history for both parties.

### 3.5 Fun & Interactive Elements
- Reactions/likes and lightweight comments on gallery pieces.
- Seller "now open / now closed" live status badges.
- Progress reveal for in-progress commissions (sellers can post WIP sketches buyers can react to).
- Achievement badges for sellers (e.g. "50 commissions completed," "top rated") and buyers ("first commission," "collector").

### 3.6 Trust & Reputation
- Verified reviews tied to completed transactions only.
- Response-time and completion-rate stats shown on shop pages.
- Reporting/flagging for inappropriate content or non-delivery, feeding an admin moderation queue.

## 4. Technical Architecture

The stack below targets a small team shipping quickly on a modern, well-supported React foundation, while keeping payments compliance and test coverage manageable from day one.

### 4.1 Recommended Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend framework | Next.js (App Router) + React | Server components for fast gallery/browse pages, file-based routing, built-in image optimization for artwork-heavy pages, one deploy target for frontend + API. |
| Styling / UI | Tailwind CSS + shadcn/ui | Utility-first styling matches the request for Tailwind; shadcn/ui gives accessible, themeable components (dialogs, forms, toasts) without a heavy design-system dependency. |
| Backend / API | Next.js Server Actions & Route Handlers | Keeps a single codebase and deploy pipeline for a project this size; can be split into a standalone service later if traffic demands it. |
| Database | PostgreSQL (Supabase or Neon) | Relational data (users, shops, listings, orders, payments) benefits from real relations and transactions; Supabase adds auth, storage, and realtime out of the box if useful. |
| ORM | Drizzle or Prisma | Type-safe queries and migrations. Drizzle is lighter-weight; Prisma has a larger ecosystem and admin tooling — either is a reasonable, low-risk choice. |
| Authentication | Auth.js (NextAuth) or Clerk | Email + OAuth (Google, Apple) sign-in; Clerk trades a bit of cost for less auth code to secure and test. |
| Payments | Stripe Connect (Express accounts) | Purpose-built for marketplaces: onboards sellers, splits payments between platform and seller, supports delayed capture (escrow-style) and automated payouts. Card data never touches the app — Stripe Elements/Checkout handles it, which drastically shrinks PCI scope. |
| File / image storage | Cloudflare R2 or S3 + CDN | Artwork and reference images are the platform's core asset; needs resized, cached delivery. |
| Background jobs | Inngest or a Postgres-backed queue | Payout scheduling, notification emails, image processing, and slot auto-close logic. |
| Hosting | Vercel (app) + managed Postgres provider | Native Next.js support, preview deploys per PR, easy environment separation (dev/staging/prod). |
| Email / notifications | Resend or Postmark | Transactional email for order status changes, commission requests, and payout confirmations. |

**Note (important divergence from the user's actual repo layout):** this proposal's recommended architecture assumes a *single* Next.js codebase serving both frontend and API. The user's actual workspace has two separate repos (`shareart-frontend`, `shareart-backend`), which implies a real client/server split. This divergence is captured as an open question in the requirements clarification questions.

### 4.2 High-Level System Diagram (described)
Client (Next.js/React + Tailwind) → Next.js server (Route Handlers / Server Actions) → PostgreSQL (via ORM) for core data, Stripe Connect for all money movement, object storage + CDN for images, and a background job runner for async work (payouts, emails, notifications). Auth provider issues sessions consumed by both the client and server layer.

### 4.3 Core Data Model (simplified)

| Entity | Key Fields | Notes |
|---|---|---|
| User | id, email, role, createdAt | role ∈ {buyer, seller, admin}; a user can be both buyer and seller. |
| ShopProfile | userId, bio, banner, socialLinks, status | One-to-one with a seller user; status = open/closed/waitlist. |
| CommissionRuleSet | shopId, tiers[], rules(rich text/blocks), slotsOpen, maxQueue | Versioned so past buyers can see the rules that applied to their order. |
| Listing | shopId, type(finished/commission-tier), title, price, images[] | Finished work supports direct "buy now" checkout. |
| CommissionRequest | buyerId, shopId, tierId, description, references[], budget, status | Drives the request → delivery pipeline. |
| Order | requestId or listingId, buyerId, sellerId, amount, platformFee, status | One row per paid transaction; ties to Stripe PaymentIntent. |
| Message | orderId, senderId, body, attachments[] | Threaded per order/request. |
| Review | orderId, rating, body | Only creatable after an order reaches Completed. |
| Payout | sellerId, orderIds[], amount, stripeTransferId, status | Reconciles platform ledger with Stripe Connect transfers. |

## 5. Security & Payment Safety

Because real money changes hands, security work isn't optional polish — it's part of the MVP.

### 5.1 Payments
- No raw card data touches the app. Stripe Elements/Checkout collects card details directly; the platform only ever sees tokens and Stripe object IDs, which keeps PCI DSS scope to the minimal SAQ-A level.
- Escrow-style delayed capture. Funds are authorized on request acceptance and captured on delivery/approval, so a buyer isn't charged for undelivered work and a seller has a payment guarantee before starting.
- Signed webhooks only. All Stripe events are verified via webhook signing secrets before the app trusts them; payment state is only ever updated from verified webhook events, never from client-side confirmation alone.
- Idempotency keys on all payment-mutating requests to prevent double-charges on retry.

### 5.2 Application Security
- Authentication via a vetted provider (Auth.js/Clerk) rather than hand-rolled sessions; passwords never stored directly.
- Role-based access control (RBAC) enforced server-side on every mutation — e.g. only a shop's owner can edit its rules; only an order's buyer/seller can view its messages.
- Input validation and sanitization on every form (schema validation library such as Zod) and file-type/size checks on all uploads.
- Rate limiting on auth, commission-request submission, and messaging endpoints to blunt abuse and scraping.
- CSRF protection on state-changing requests, and standard secure headers (CSP, HSTS, X-Frame-Options).
- Secrets (Stripe keys, DB credentials) stored in environment/secret managers, never committed to source.
- Audit log of admin actions (moderation, manual refunds, account suspensions).

### 5.3 Content & Trust Safety
- Image upload scanning/moderation hooks for flagged or reported content.
- Report/flag pipeline routed to an admin queue with the ability to freeze a shop or order under dispute.

## 6. Testing Strategy — 80% Coverage Target

Hitting 80% coverage is realistic if testing is planned alongside features rather than added at the end. The suite is layered so that most coverage comes from fast, cheap tests, with a thinner layer of slow, high-value end-to-end tests on top.

| Layer | Tooling | What it covers | Target |
|---|---|---|---|
| Unit | Vitest (or Jest) + Testing Library | Pure functions, pricing/fee calculations, form validation, utility/helper logic. | ≥ 85% of units |
| Component | React Testing Library | Shop rule editor, commission request form, listing cards, checkout flow, rendered in isolation with mocked data. | ≥ 80% of components |
| Integration / API | Vitest + a test database (Docker Postgres) | Route handlers/Server Actions: order creation, status transitions, RBAC checks, webhook handlers. | ≥ 80% of routes |
| End-to-end | Playwright | Critical user journeys: sign up → open shop → publish rules; browse → request commission → pay → receive delivery. | Top 8–10 flows |
| Payments | Stripe test mode + webhook fixtures | Successful payment, failed payment, dispute, refund, delayed-capture expiry. | All critical paths |

### 6.1 Enforcing the Bar
- Coverage thresholds (branches, functions, lines ≥ 80%) enforced in CI via the test runner's built-in coverage gate — a PR that drops below the threshold fails the build.
- Coverage reports published per PR (e.g. via a coverage-diff bot) so drops are visible in review, not just at merge.
- Payment and auth code held to a higher bar than the platform average, since regressions there are the most expensive.
- Seed/fixture data and a reset-able test database so integration tests are deterministic and can run in CI on every push.

## 7. Suggested Roadmap

| Phase | Scope |
|---|---|
| Phase 1 — MVP | Auth, shop creation, commission rule editor, browse/gallery, commission request flow, Stripe Connect onboarding + escrow payments, order status pipeline, basic messaging. |
| Phase 2 — Trust & Growth | Reviews/ratings, search & filtering, notifications (email + in-app), milestone payments, admin moderation tools, reporting/flagging. |
| Phase 3 — Delight | Reactions/likes, WIP progress reveals, badges/achievements, featured/curated discovery, seller analytics dashboard. |

## 8. Open Questions for Next Steps

- Commission structure: what percentage does the platform take, and does it vary by seller tier or transaction size?
- Should finished-work "buy now" purchases and commissioned work share the same checkout, or be kept as distinct flows?
- Geographic scope for launch (affects Stripe Connect payout countries and tax handling).
- Content policy: what categories of art (e.g. mature content) are allowed, and how are they gated?
- Target launch timeline and team size, to size Phase 1 realistically against the roadmap above.

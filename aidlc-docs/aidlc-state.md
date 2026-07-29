# AI-DLC State Tracking

**Combined workflow (superseded)**: This session started as a combined workflow spanning `shareart-frontend` and `shareart-backend`. Per the Application Design decision, all code and Construction-phase artifacts now target **`shareart-frontend` only** — `shareart-backend` is retired (its `aidlc-docs/` pointer files remain for reference but no units target it).

## Project Information
- **Project Type**: Brownfield (`shareart-frontend`, being replaced); `shareart-backend` retired
- **Start Date**: 2026-07-26T00:00:00Z
- **Current Stage**: CONSTRUCTION and Build and Test complete — ready for Operations (placeholder phase)

## Workspace State
- **shareart-frontend**: Existing code (Yes) — a small Next.js 15 personal portfolio site ("Makenna Avakian Art"), no backend/API/DB wired up yet. See `inception/reverse-engineering/`.
- **shareart-backend**: Existing code (No) — empty repo, README only ("Backend for AvakianArt.com").
- **Reverse Engineering Needed**: Yes (frontend, completed) / No (backend, nothing to reverse-engineer)
- **Workspace Root(s)**:
  - `C:\Users\Makenna Avakian\codeprojectz\shareart-frontend`
  - `C:\Users\Makenna Avakian\codeprojectz\shareart-backend`

## Code Location Rules
- **Application Code**: Each repo's own root (NEVER in aidlc-docs/)
- **Documentation**: `aidlc-docs/` only (canonical copy in `shareart-frontend`)
- **Structure patterns**: See `construction/code-generation.md` (once loaded) for patterns by project type

## Extension Configuration
| Extension | Enabled | Decided At |
|---|---|---|
| Security Baseline | Yes | Requirements Analysis |
| Resiliency Baseline | Yes | Requirements Analysis |
| Property-Based Testing | Yes (full enforcement) | Requirements Analysis |

## Stage Progress
### 🔵 INCEPTION PHASE
- [x] Workspace Detection
- [x] Reverse Engineering (shareart-frontend; shareart-backend skipped — genuinely empty)
- [x] Requirements Analysis — `requirements.md` complete, Phase 1/MVP scope confirmed
- [x] User Stories — 40 stories (S-1..S-40) across Seller/Buyer personas, `inception/user-stories/`
- [x] Workflow Planning — `inception/plans/execution-plan.md`, awaiting approval
- [x] Application Design — 9 components, 5 services, dependency map; `inception/application-design/`
- [x] Units Generation — 6 units defined, all 40 stories mapped; `inception/application-design/unit-of-work*.md`

**INCEPTION PHASE COMPLETE.**

### 🟢 CONSTRUCTION PHASE (per unit, in approved sequence — one implementer/session, sequential)
Build sequence: 1. Auth & Accounts → 2. Shops & Commission Rules → 3. Listings → 4. Browse & Discovery → 5. Commission Requests & Messaging → 6. Orders & Payments

- [x] **Unit 1: Auth & Accounts** — COMPLETE (all Construction stages done, verified, committed to `main`)
- [x] **Unit 2: Shops & Commission Rules** — COMPLETE (all Construction stages done, verified, committed to `main`)
- [x] **Unit 3: Listings** — COMPLETE (all Construction stages done, verified, committed to `main`)
- [x] **Unit 4: Browse & Discovery** — COMPLETE (all Construction stages done, verified, committed to `main`)
- [x] **Unit 5: Commission Requests & Messaging** — COMPLETE (all Construction stages done, verified, committed to `main`)
- [x] **Unit 6: Orders & Payments** — COMPLETE (all Construction stages done, verified, committed to `main` as `22f1ab2`) — FINAL UNIT of Phase 1

**CONSTRUCTION PHASE (Per-Unit Loop) COMPLETE — all 6 units built, verified, and committed.**

- [x] Build and Test (all units) — COMPLETE, see `construction/build-and-test/build-and-test-summary.md`

## Key Decisions Log
- Single Next.js codebase in `shareart-frontend`; `shareart-backend` retired (no code generated there going forward).
- Existing personal portfolio site content is replaced, not migrated.
- Scope for this workflow = Phase 1 (MVP) only.
- Code organization: feature-folder by unit under `src/server/*`, routes/UI only in `src/app/`.
- FR-8 (in-app status badge) added during Application Design; full notifications remain Phase 2.

## Project-Wide Resiliency Process Decisions (decided at Unit 1 NFR Design; applies to all units, not re-asked)
- CI/CD: GitHub Actions (lint/typecheck/test/coverage-gate) + Vercel preview-per-PR and production deploy on merge.
- Rollback: Vercel native version-pinned instant rollback.
- Deployment style: Rolling (realized as Vercel's atomic per-deploy cutover model).
- Incident response: lightweight on-call-is-the-implementer + dated COE notes in `aidlc-docs/operations/` (no formal tooling for Phase 1).
- Resiliency testing: manual "game day" checklist (3 DR scenarios documented in `construction/unit-1-auth/nfr-design/nfr-design-patterns.md`), no automated chaos tooling for Phase 1.

## Project-Wide Infrastructure Decisions (decided at Unit 1 Infrastructure Design; see construction/shared-infrastructure.md)
- Managed Postgres: Neon. Environments: dev/staging/prod (staging via Neon branch). Scheduled jobs: Vercel Cron. Observability: Vercel built-in + Sentry.
- Object storage (decided at Unit 2 NFR Requirements): Cloudflare R2, S3-compatible SDK, next/image for delivery, presigned direct-to-storage uploads.

### 🟡 OPERATIONS PHASE
- [ ] Placeholder

## Post-Phase-1 Work (ad hoc, outside the formal per-unit Construction loop)
Phase 1 Construction and Build and Test were already complete; the items below were done directly at the user's request during first local setup and initial UI review, rather than run back through Requirements Analysis/Application Design/Units Generation — each is small enough in scope (bug fix, visual-only pass, one small self-contained feature) that the adaptive workflow's own skip criteria applied (no new components/services, no cross-cutting business rules).

1. **Local environment setup fixes** (2026-07-26): `drizzle-kit` only auto-loads a file literally named `.env`, not Next.js's `.env.local` — renamed. `stripe` npm package was declared in `package.json` since Unit 6 but never actually installed — ran `npm install`. Consolidated Units 1-6's six hand-written "illustrative" per-unit migration files into the one real migration `drizzle-kit generate` produced against an actual `DATABASE_URL` (the illustrative files were never tracked by drizzle-kit's journal).

2. **Critical bug fix — credentials sign-in never established a working session**: Unit 1's Functional Design decided on database-strategy sessions (`nfr-design/logical-components.md` Question 2: A), but Auth.js does not support database sessions together with the Credentials provider — a credentials sign-in silently falls back to a JWT cookie regardless of the configured strategy, and the `session` callback (written for the database-strategy `{session, user}` signature) never populated `session.user.id` under JWT, making every credentials-authenticated session unreadable. This was invisible to the test suite (every test mocks `auth()`) and had gone undetected through all of Units 1-6's construction. Fixed by switching to `session: { strategy: "jwt" }` app-wide plus a `jwt` callback — confirmed via direct `curl` against `/api/auth/callback/credentials` and `/api/auth/session`, then in-browser. Also separately fixed (2026-07-26, earlier the same day): the hand-rolled Auth.js `Adapter` was missing `updateUser`/`updateSession`, which Auth.js's `assertConfig()` requires whenever an adapter is configured at all — this was the first bug found, and unblocked the dev server enough to discover the deeper JWT/database-strategy issue above.

3. **New feature — Account Settings page** (`/account`): view email, edit display name, change password (hidden for Google-only accounts with no `passwordHash`). Added `updateDisplayName`/`changePassword` to `src/server/auth/service.ts`, broadened `updateUserRow` to accept `passwordHash`, new `src/app/account/actions.ts` Server Actions, `DisplayNameForm`/`ChangePasswordForm` client components, full test coverage. Reachable via the Navbar's user menu.

4. **UI design system pass** ("warm & editorial", user-directed toward an ArtForum-like aesthetic): cream/paper background, warm ink foreground, a muted terracotta accent, `Fraunces` serif for display type paired with the existing Geist Sans, sharp/square geometry (no `rounded-lg`/`rounded-full` except avatars and the unread-notification dot), tracked-uppercase labels for nav/buttons/section headers. Defined as CSS custom properties in `globals.css` (`--background`, `--surface`, `--foreground`, `--muted`, `--border`, `--accent`, `--accent-hover`) mapped into Tailwind v4's `@theme inline`, then propagated across all ~40 page/component files. Also fixed two latent bugs surfaced along the way: `globals.css` had an unconditional `prefers-color-scheme: dark` override flipping the page background to near-black while `Navbar` stayed hardcoded `bg-white` (a pre-existing light/dark clash, never noticed since the app had never been run in a real browser before this session); and the body's `font-family: Arial` override meant the previously-loaded Geist Sans variable was never actually applied to any text.

5. **Navbar user menu**: replaced the plain display-name text + always-visible "My Shop" link with a rounded initial-letter avatar button that opens a dropdown (Account, My Shop — now correctly gated on a real `isSeller` check rather than shown to any signed-in user, Sign out).

6. **Seller shop customization / promotion tools**: `shopProfiles.bannerImageUrl`, `avatarImageUrl`, and `socialLinks` had DB columns and were rendered on the public shop page but had **zero editing UI** anywhere — sellers could never actually set them. Built: a background-image and avatar uploader (`ShopImageUploader.tsx`, reusing the presigned-upload flow already established for portfolio images), a `SocialLinksEditor.tsx` (label + URL list), and — per explicit user request — a new `shopProfiles.shopName` column (migration `drizzle/0001_shop_name.sql`) so a seller's shop can be branded separately from their personal account display name. `shopName` now coalesces over `users.displayName` in all three places a shop's name is read (gallery listing cards, artist search — including the full-text search source itself, and the public shop page), so setting it propagates everywhere without further changes. Also fixed two latent bugs found while building this: (a) the shops-repository integration test's `afterEach` deleted `commissionRuleVersions` before `shopCommissionSettings`, violating the FK from the latter to the former — invisible until this session actually had a real `DATABASE_URL` to run these against; (b) a React hydration mismatch in `ShopProfileForm.tsx` — its `useState` initializer called `crypto.randomUUID()` to backfill ids for social links loaded from the DB, which produced different ids on the server render vs. the client hydration render (fixed with a deterministic `initial-${index}` fallback instead).

7. **CI pipeline failure fix + coverage gate made real** (2026-07-28): The GitHub Actions `lint-typecheck-test` job was failing with `Error connecting to database: fetch failed` for the DB-integration test suites. Root cause: `src/server/db/client.ts` used `@neondatabase/serverless`'s HTTP-only driver, incompatible with CI's plain-TCP `postgres:16` container — switched to `postgres` + `drizzle-orm/postgres-js` (works over TCP against both Neon and vanilla Postgres; confirmed no route uses `runtime = "edge"` first). This surfaced three more latent bugs once the DB layer actually worked end-to-end: a FK-ordering mistake in three integration tests' `afterEach` cleanup (`commissionRuleVersions` deleted before `shopCommissionSettings`, which FKs to it), a Vitest file-parallelism race condition across the `*/repository.test.ts` integration suites (fixed via `fileParallelism: false`), and a genuine clock-skew bug in `orders/repository.ts`'s `updateOrderRow` (mixed a client `new Date()` with the DB's `defaultNow()` from insert — fixed with `sql\`now()\`` for the update too).

   With the database working, ran `npm run test:coverage` for the first time in the project's real history and found the 80% gate had likely never actually passed (~54% actual). Per user decision (excluding thin route wrappers first, then writing the remaining real tests rather than lowering the threshold), wrote/expanded ~25 test files covering components, services, repositories, and full branch coverage of every Server Action file. Final coverage: 94.17% statements, 86.39% branches, 84.89% functions, 94.17% lines. Full verification clean: `tsc`, `eslint`, `vitest run` (67 files / 422 tests), `next build --turbopack` (22 routes).

8. **Production infrastructure fixes** (2026-07-28): the live site (`makennaavakianart.com`, Vercel project `makennaavakianart-frontend`) was throwing `Application error` on `/gallery`. Root-caused to two independent problems: (a) the production database was missing the `shop_name` migration from item 6 above, since nothing in this repo runs migrations automatically on deploy — applied it for real against production via `vercel env pull` + `drizzle-kit migrate`; (b) the Vercel project had **zero environment variables configured** for Production at all (confirmed via `vercel env ls`), so `DATABASE_URL`/`AUTH_SECRET`/etc. were all undefined — user is populating these directly in the Vercel dashboard. Separately fixed a Vercel build-time "vulnerable Next.js version" gate by upgrading 15.5.4 → 15.5.22 (patches a critical RCE in the React flight protocol plus numerous other CVEs), bumped `next-auth` to 5.0.0-beta.32 (patches a critical email-homoglyph auth-bypass advisory in `@auth/core`), and added baseline response security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, HSTS) plus disabled `X-Powered-By`, since the app is now genuinely live.

9. **Upload size enforcement fix**: `createPresignedUpload` issued a plain S3 presigned PUT URL — R2/S3 never validates a PUT's body size against the URL, so `validateImageUpload`'s 5MB check only constrained the *declared* size at request time, not the actual bytes uploaded; any signed-in user could bypass it entirely. Switched to a presigned POST with a `content-length-range` condition enforced by R2 itself at upload time, threading the resulting `uploadFields` through every layer (storage → service → actions → `ShopImageUploader.tsx`/`PortfolioManager.tsx`, now building `multipart/form-data` POSTs instead of raw PUTs).

10. **Shop-discovery dead end + post-sign-in redirect loop**: there was no UI path to `/shop/new` anywhere (the "My Shop" link only appeared once a user already had a shop), and every sign-in/sign-up flow hardcoded `redirectTo: "/"`, so even a user who found the URL directly got bounced to the homepage after signing in instead of continuing there. Added a `sanitizeCallbackUrl` helper (`src/server/auth/redirect.ts`, rejects absolute/protocol-relative URLs to prevent open redirects) threaded through credentials sign-in, Google OAuth, and all 12 pages that redirect anonymous visitors to sign-in; added the actual missing "Open a Shop" (UserMenu, signed-in non-sellers) and "Sell on Inkwell" (Navbar, signed-out visitors) links. Separately, `createShopAction` never redirected anywhere on success (just returned to the same create form) — added `redirect("/shop")` after a successful creation, called outside the action's try/catch so Next.js's internal redirect throw isn't swallowed by the generic error handler.

11. **Portfolio redesign** (2026-07-28, user-directed — "this should be a really central part" of a seller's shop): the portfolio was upload-only with no titles, captions, tags, delete, or reordering, and rendered as a flat grid of 200px thumbnails on the public shop page. Added `title`/`caption`/`tags`/`listingId`/`featured` columns to `portfolio_images` (migration `drizzle/0002_portfolio_metadata.sql`, generated for real once the local `DATABASE_URL` credential — separately found to be stale — was refreshed); full CRUD + reorder + feature-toggle repository/service/action layers, each authorization-scoped to the owning shop (an image update/delete/reorder validates the image and every id in a reorder request actually belongs to the caller's shop, not just that the caller owns *a* shop). Rebuilt `PortfolioManager.tsx` (seller side: inline title/caption/tags/listing-link editing, delete, drag-and-drop plus accessible move-up/down reorder, one-featured-piece-per-shop pinning) and added `PortfolioGallery.tsx` (public side: larger grid with the featured piece given a bigger span, click-to-open lightbox showing the full image plus metadata, and an "Available now →" link when a piece is linked to a listing that's still available). Portfolio's page position (already the first section after the shop header, before commission rules) didn't need to change — only what renders there.

All of the above verified via the full suite (`tsc`/`eslint`/`vitest`/`next build`) and, where relevant, live in-browser — see `audit.md` for the detailed entries.

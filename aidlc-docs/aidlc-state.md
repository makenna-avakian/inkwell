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

All of the above verified via the full suite (`tsc`/`eslint`/`vitest`/`next build`) and, where relevant, live in-browser — see `audit.md` for the detailed entries.

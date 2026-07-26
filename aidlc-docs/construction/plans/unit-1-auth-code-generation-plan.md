# Code Generation Plan — Unit 1: Auth & Accounts

## Unit Context

- **Stories implemented**: S-1 (per unit-of-work-story-map.md).
- **Dependencies**: None — Unit 1 is foundational.
- **Interfaces this unit exposes to later units**: `getSession()`, `isSeller(userId)` (business-logic-model.md) — Units 2-6 will call these for authorization.
- **Database entities owned**: `User`, `Session`, `OAuthAccount`, `LoginAttempt`.
- **Workspace root**: `C:\Users\Makenna Avakian\codeprojectz\shareart-frontend` (per aidlc-state.md). Brownfield — existing personal-portfolio pages are being replaced per requirements.md's "replace entirely, no migration" decision; this is the first unit to touch the existing code, so it also removes the now-superseded personal-site pages/components.
- **Code organization**: `src/server/auth/` (per unit-of-work.md Question 3: A), `src/app/` for routes/UI only.

## Steps

- [x] **Step 1: Project Structure Setup** — add dependencies (`next-auth@beta`, `drizzle-orm`, `drizzle-kit`, `@neondatabase/serverless`, `bcryptjs`, `zod`, `vitest`, `@vitejs/plugin-react`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `fast-check`, `@sentry/nextjs`); remove unused `@tanstack/react-router` (flagged in reverse-engineering/code-quality-assessment.md); add `vitest.config.ts`, `drizzle.config.ts`, `.env.example`.
- [x] **Step 2: Remove Superseded Personal-Site Files** — delete `src/app/gallery/page.tsx`, `src/app/contact/page.tsx`, `src/app/design/page.tsx`, `src/app/components/CatEyes.tsx`, `src/app/components/IntroAnimation.tsx`, `src/app/components/Navbar.tsx` (personal-site version). Their replacements belong to later units (Unit 2/3/4 for the marketplace pages; a new Navbar ships in this unit, minimal, extended by later units).
- [x] **Step 3: Database Schema & Migration** — `src/server/db/schema.ts` (Drizzle schema for User/Session/OAuthAccount/LoginAttempt), `src/server/db/client.ts` (Neon/Drizzle client), initial migration via `drizzle-kit generate`.
- [x] **Step 4: Business Logic Generation** — `src/server/auth/password.ts` (hash/verify, bcrypt), `src/server/auth/rate-limit.ts` (BR-6 progressive delay), `src/server/auth/service.ts` (signUp/signIn/signOut orchestration, `isSeller`), `src/server/auth/config.ts` (Auth.js config: Drizzle adapter, Credentials + Google providers, database session strategy).
- [x] **Step 5: Business Logic Unit + Property-Based Testing** — `src/server/auth/password.test.ts` (bcrypt round-trip, example + fast-check), `src/server/auth/rate-limit.test.ts` (BR-6 invariants, fast-check), `src/server/auth/service.test.ts` (example-based: sign-up, sign-in success/failure, OAuth linking).
- [ ] **Step 6: Business Logic Summary** — `aidlc-docs/construction/unit-1-auth/code/business-logic-summary.md`.
- [x] **Step 7: API Layer Generation** — `src/app/api/auth/[...nextauth]/route.ts` (Auth.js handler), `src/app/(auth)/sign-up/actions.ts` (sign-up Server Action, Zod-validated), `src/app/api/cron/cleanup-auth/route.ts` (secret-protected cleanup endpoint).
- [x] **Step 8: API Layer Unit Testing** — `src/app/(auth)/sign-up/actions.test.ts`, `src/app/api/cron/cleanup-auth/route.test.ts`.
- [ ] **Step 9: API Layer Summary** — `aidlc-docs/construction/unit-1-auth/code/api-layer-summary.md`.
- [x] **Step 10: Repository Layer Generation** — `src/server/auth/repository.ts` (Drizzle queries for User/Session/OAuthAccount/LoginAttempt, used by service.ts).
- [x] **Step 11: Repository Layer Unit Testing** — `src/server/auth/repository.test.ts` (against an in-memory/test DB pattern — concrete test-DB wiring finalized in Build and Test phase per requirements.md NFR-3).
- [x] **Step 12: Repository Layer Summary** — `aidlc-docs/construction/unit-1-auth/code/repository-layer-summary.md`.
- [x] **Step 13: Frontend Components Generation** — `src/app/components/auth/SignUpForm.tsx`, `SignInForm.tsx`, `OAuthButton.tsx`, `AuthErrorBanner.tsx`, `src/app/(auth)/sign-up/page.tsx`, `src/app/(auth)/sign-in/page.tsx`, new minimal `src/app/components/Navbar.tsx` (shows Sign In/Sign Up when logged out, displayName + Sign Out when logged in — full marketplace nav links added by later units), updated `src/app/layout.tsx` (title → "Inkwell"), updated minimal `src/app/page.tsx` placeholder landing page.
- [x] **Step 14: Frontend Components Unit Testing** — `SignUpForm.test.tsx`, `SignInForm.test.tsx` (React Testing Library, `data-testid`-based per Automation Friendly Code Rules).
- [x] **Step 15: Frontend Components Summary** — `aidlc-docs/construction/unit-1-auth/code/frontend-components-summary.md`.
- [x] **Step 16: Database Migration Scripts** — finalize `drizzle/` migration folder output from Step 3, add `db:generate`/`db:migrate` npm scripts.
- [x] **Step 17: Documentation Generation** — update `README.md` (project is now Inkwell, not the old portfolio site; setup instructions for env vars, Neon, running migrations).
- [x] **Step 18: Deployment Artifacts Generation** — `.github/workflows/ci.yml` (GitHub Actions: lint, typecheck, test, coverage gate, per NFR Design's CI/CD decision), `vercel.json` (Cron job schedule for the cleanup endpoint, per Infrastructure Design).

## Story Traceability
- S-1 (seller creates an account) → Steps 1, 3, 4, 5, 7, 8, 13, 14 (sign-up flow end-to-end). Note: "seller" here just means "a User" — capability is derived (BR-8), so this is the same sign-up flow for every user.

This plan is the single source of truth for Unit 1 Code Generation — execution will follow these 18 steps in order.

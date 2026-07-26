# Business Logic Summary — Unit 1: Auth & Accounts

## Files
- `src/server/auth/password.ts` — bcrypt hash/verify (BR-3).
- `src/server/auth/rate-limit.ts` — BR-6 progressive-delay pure functions.
- `src/server/auth/repository.ts` — Drizzle queries for User/Session/OAuthAccount/LoginAttempt.
- `src/server/auth/service.ts` — signUp orchestration, rate-limit gate, display-name default (BR-4).
- `src/server/auth/adapter.ts` — hand-rolled Auth.js `Adapter` over our schema (see rationale in the file).
- `src/server/auth/config.ts` — Auth.js instance: Credentials + Google providers, database sessions.

## Tests
- `password.test.ts` — example tests + PBT-01/PBT-02 round-trip properties (fast-check).
- `rate-limit.test.ts` — example tests + PBT-01/PBT-03 invariant properties (monotonicity, 0-60 bound, reset-on-success).
- `service.test.ts` — example-based tests for sign-up, duplicate-email rejection, rate-limit gate, enumeration-safe attempt recording.

## Deviations from Functional Design (documented, not silent)
- `isSeller(userId)` (business-logic-model.md) is **not yet implemented** — it depends on Unit 2's `ShopProfile` table, which doesn't exist yet in this sequential build. A comment in `service.ts` marks where it will be added when Unit 2 lands.
- Used a hand-rolled Adapter instead of `@auth/drizzle-adapter` because our `OAuthAccount` schema is intentionally minimal (no stored OAuth tokens) relative to Auth.js's default Account model — see `adapter.ts`'s top comment.

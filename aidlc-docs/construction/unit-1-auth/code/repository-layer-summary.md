# Repository Layer Summary — Unit 1: Auth & Accounts

## File
- `src/server/auth/repository.ts` — all Drizzle queries for `users`, `sessions`, `oauthAccounts`, `loginAttempts`. No business logic here (validation, hashing, rate-limit math all live in `service.ts`/`password.ts`/`rate-limit.ts`) — this file is pure data access.

## Tests
- `repository.test.ts` — integration-style tests against a real Postgres instance, `describe.skipIf(!process.env.DATABASE_URL)`. These are **not runnable standalone** — they require the Docker Postgres test database that the Build and Test phase provisions (per requirements.md NFR-3's Integration/API test layer). Running `npm test` without `DATABASE_URL` set skips this file entirely (by design — it does not fail).

## Outstanding Setup (flagged for Build and Test / Infrastructure Design follow-through)
- `npm run db:generate` must be run against a real Neon `DATABASE_URL` to produce drizzle-kit's official migration + snapshot metadata (`drizzle/meta/`). `drizzle/0000_unit1_auth_schema.sql` in this repo is an **illustrative** hand-written version of that first migration's expected SQL, not the drizzle-kit-generated artifact itself.

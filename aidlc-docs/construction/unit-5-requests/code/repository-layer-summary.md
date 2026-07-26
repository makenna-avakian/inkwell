# Repository Layer Summary — Unit 5: Commission Requests & Messaging

## File
`src/server/requests/repository.ts` — Drizzle queries for all 4 tables. `joinWaitlistRow` and `upsertReadReceipt` use `onConflictDoNothing`/`onConflictDoUpdate` for DB-level idempotency.

## Tests
`repository.test.ts` — integration tests, `describe.skipIf(!process.env.DATABASE_URL)`. Covers: waitlist join idempotency at the DB level, and that only `'requested'`-status requests count as active (an `'accepted'` request is correctly excluded, per Question 2: A).

`drizzle/0004_unit5_requests_schema.sql` is illustrative, same caveat as prior units.

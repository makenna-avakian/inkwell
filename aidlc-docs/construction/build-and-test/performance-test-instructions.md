# Performance Test Instructions

## Purpose
`requirements.md` does not define numeric performance NFRs (no documented response-time/throughput/concurrent-user targets) — this mirrors the project-wide Resiliency decision (`aidlc-state.md` → "Project-Wide Resiliency Process Decisions") that Phase 1 relies on manual checks rather than automated load/chaos tooling. This file documents the lightweight checks that are in scope, not a formal load-testing harness.

## What's Actually Covered
- **Vercel platform defaults**: serverless function cold-start and autoscaling are handled by the deployment platform (see `construction/shared-infrastructure.md`), not something this MVP configures manually.
- **Database**: Neon Postgres serverless — connection pooling is handled by the `@neondatabase/serverless` HTTP driver (`src/server/db/client.ts`), not a manually-tuned connection pool.
- **N+1 / obvious query inefficiencies**: checked ad hoc during code review of each unit's repository layer (e.g., Unit 4's discovery filters use indexed columns; Unit 6's order lookups are by primary key or indexed foreign keys — see `drizzle/0005_unit6_orders_schema.sql`'s `orders_buyer_id_idx`/`orders_seller_id_idx`).

## Manual Smoke Check (if desired before a real launch)
```bash
npm run build && npm start
# then, from another terminal:
npx autocannon -c 10 -d 10 http://localhost:3000/gallery
```
There is no pass/fail threshold defined for this — it's a sanity check, not a gate.

## Out of Scope for Phase 1
- Load testing, stress testing, and formal throughput/error-rate targets are deferred — flag as a Phase 2 candidate if traffic volume warrants it.

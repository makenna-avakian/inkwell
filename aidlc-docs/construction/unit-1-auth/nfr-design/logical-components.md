# Logical Components — Unit 1: Auth & Accounts

## Components Needed
- **Postgres tables**: `User`, `Session`, `OAuthAccount`, `LoginAttempt` (per domain-entities.md) — no additional infrastructure components (no cache, no queue) needed for this unit at Phase 1 scale.
- **Scheduled job**: a cleanup job (per NFR Requirements' data-retention decision) — concrete infrastructure (Vercel Cron vs. a different scheduler) decided at Infrastructure Design.

## Components Explicitly Not Needed (and why)
- **Cache (Redis/Memcached)**: Not needed — session lookups are a single indexed Postgres read per request; no evidence of a performance problem to justify the added operational complexity at this scale.
- **Message queue**: Not needed — Auth has no async/background work beyond the scheduled cleanup job, which is a simple periodic task, not a queue-worthy workload.
- **Circuit breaker component**: Deliberately not implemented — see nfr-design-patterns.md's Circuit Breaking rationale.

## Integration Pattern
- Auth.js is configured with the Drizzle adapter, pointed at the same Postgres instance the rest of the application uses (no separate auth database) — consistent with the single-codebase, single-database architecture decision in requirements.md.
- The scheduled cleanup job is the only component in this unit that runs outside the request/response cycle; it calls the same Drizzle-based data layer as the rest of the unit, just on a timer instead of a request.

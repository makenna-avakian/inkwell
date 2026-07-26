# NFR Requirements — Unit 1: Auth & Accounts

## Scalability
- No specific concurrency target set for Phase 1 (small-startup scale, per requirements.md team/timeline answer). Database-backed sessions (Functional Design decision) mean session-store scaling is Postgres's scaling story, not a separate cache tier — acceptable at this scale; revisit if session-table read load ever becomes a bottleneck.

## Performance
- **Target** (Question 2: B): p95 < 500ms for sign-in, excluding the OAuth redirect round-trip (which depends on Google's own latency, outside this unit's control).
- No target set for sign-up (less latency-sensitive; happens once per user).

## Availability
- Inherits project-wide Resiliency Baseline decisions (requirements.md): single-region multi-zone, Backup & Restore DR (hours-scale RTO/RPO). No unit-specific override — Auth has no availability requirement stricter than the rest of the application at Phase 1 scale.

## Security
- Full SECURITY rule set applies (Security Baseline enabled project-wide). Rules already addressed at the business-rule level in Functional Design (BR-1..BR-9): SECURITY-05, 08, 09, 11, 12, 15. Remaining infra-facing rules (SECURITY-01, 02, 04, 06, 07, 09-hardening, 10, 13, 14) are addressed at NFR Design/Infrastructure Design/Code Generation for this unit.
- **Hashing algorithm**: bcrypt (Question 1: A) — satisfies SECURITY-12's adaptive-hashing requirement.

## Reliability
- **Data retention** (Question 3: B): a scheduled cleanup job deletes expired `Session` rows and `LoginAttempt` rows older than 30 days. This is a background job — its infrastructure (cron/scheduled function) is decided at Infrastructure Design, but the business requirement (what to delete, and the 30-day window) is fixed here.
- Fail-closed session resolution (BR-9) ensures a broken session-lookup path degrades to "logged out" rather than an inconsistent authenticated state.

## Maintainability
- Auth.js is used as the implementation vehicle specifically to minimize hand-rolled authentication code needing ongoing security maintenance (requirements.md architecture decision).
- OAuth providers modeled as a table (`OAuthAccount`), not a boolean/enum on `User`, so adding a second provider later (e.g., Apple, deferred from Phase 1 per Question 3: B in Functional Design) needs no schema migration beyond a new enum value.

## Usability
- Sign-in error messaging is deliberately generic ("invalid email or password") for security (enumeration prevention) — this is a conscious usability/security tradeoff, not an oversight; documented so it isn't "fixed" later by someone unaware of the reason.
- Progressive-delay failures surface a "try again in Ns" countdown to the user (per `frontend-components.md`'s `retryAfterSeconds` state) rather than a bare rejection, to keep the security control from feeling like a bug.

## Tech Stack Selection
See [tech-stack-decisions.md](tech-stack-decisions.md).

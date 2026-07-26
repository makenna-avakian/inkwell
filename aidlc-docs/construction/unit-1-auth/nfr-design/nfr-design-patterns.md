# NFR Design Patterns — Unit 1: Auth & Accounts

## Project-Wide Resiliency Decisions (recorded here first, applies to all units)

These answer Resiliency Baseline's Requirements-deferred questions (RESILIENCY-04, -14, -15). Decided once, during Unit 1, and referenced (not re-asked) for Units 2-6.

| Decision | Choice |
|---|---|
| CI/CD tooling | GitHub Actions (lint, typecheck, test, coverage-gate on every PR) + Vercel's native preview-deploy-per-PR and production deploy on merge to main |
| Rollback mechanism | Vercel's native instant rollback to any previous production deployment (version-pinned) |
| Deployment style | Rolling, realized as Vercel's atomic per-deployment cutover model — each deploy is atomic and instantly reversible, which satisfies the intent of "rolling" (gradual, safe replacement) more directly than a classic instance-by-instance rolling update would for a serverless/edge platform like Vercel |
| Incident response | Lightweight process proposed: on-call is the primary implementer (small team); any production incident gets a dated Correction-of-Errors (COE) note (what happened, impact, root cause, follow-up) committed to `aidlc-docs/operations/` once the Operations phase exists; no PagerDuty/formal on-call tooling for Phase 1 |
| Resiliency testing approach | Proposed: capture DR test scenarios now (see below), execute them manually as a "game day" checklist before launch and periodically after — no automated chaos-engineering tooling for Phase 1 |

### DR Test Scenarios (RESILIENCY-14, captured now per the proposed approach above)
1. Simulate a Postgres outage (stop the dev DB) and verify the app fails closed (Unit 1's BR-9) rather than allowing stale/incorrect authentication.
2. Restore from an automated backup in a scratch environment and verify data integrity (validates the Backup & Restore DR strategy from requirements.md is actually restorable, not just configured).
3. Trigger a Vercel rollback in a non-production environment and confirm the app returns to the prior known-good state with no manual DB intervention required (validates the rollback mechanism above).

## Unit 1-Specific Resilience Patterns

### Timeouts (RESILIENCY-10)
- All Postgres queries and the Google OAuth token-exchange call use a 5-second timeout (Question 6: A). No unbounded waits anywhere in this unit.

### Retry Policy (RESILIENCY-10)
- One retry with a 100ms fixed delay on transient DB errors (connection reset, momentary unavailability), then fail (Question 7: A). Non-transient errors (constraint violations, auth failures) are never retried — retrying those would be incorrect, not resilient.

### Circuit Breaking (RESILIENCY-10)
- Not implemented for Phase 1's single external dependency (Google OAuth) — at this project's scale, a simple timeout + fail-fast is sufficient; a circuit breaker's value (avoiding repeated slow failures under sustained outage) is marginal for a single call in the sign-in path. Documented as intentionally deferred, not overlooked, in case Phase 2 traffic makes this worth revisiting.

### Fail-Safe Defaults (SECURITY-15, reinforced here)
- Consistent with BR-9 (Functional Design): any failure in the session-resolution or Auth.js call path resolves to "unauthenticated," never to a fallback "trust the request" state.

## Security Patterns (implementation-level, building on Functional Design's business rules)
- **Separation of concerns** (SECURITY-11): all Auth logic lives in `src/server/auth/`, called by Server Actions/Route Handlers — no authentication logic duplicated into route handlers directly.
- **Rate limiting** (SECURITY-11, BR-6): implemented as a DB-row-based check against the `LoginAttempt` table (not an in-memory counter), which is also what makes it correct across multiple serverless instances — an in-memory counter would not be shared across Vercel's stateless function instances, so the DB-based approach isn't just simplest, it's necessary for correctness at this deployment model.

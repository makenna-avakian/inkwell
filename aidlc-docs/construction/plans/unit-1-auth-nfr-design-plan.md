# NFR Design Plan — Unit 1: Auth & Accounts

## Note: Project-Wide Resiliency Questions, Asked Once

Resiliency Baseline (resiliency-baseline.md) requires CI/CD tooling, rollback mechanism, deployment style (RESILIENCY-04), incident response process (RESILIENCY-15), and resiliency testing approach (RESILIENCY-14) to come from the user, at NFR Design. These are **project-wide process decisions**, not Auth-specific — Questions 1-5 below are being asked now, for the first time, and the answers will be recorded in `aidlc-state.md` as project-wide so they are **not** re-asked for Units 2-6. Questions 6-7 are Auth-unit-specific.

## Execution Checklist

- [x] Resolve Question 1 (CI/CD tooling — project-wide) — B
- [x] Resolve Question 2 (rollback mechanism — project-wide) — A
- [x] Resolve Question 3 (deployment style — project-wide) — B
- [x] Resolve Question 4 (incident response process — project-wide) — B
- [x] Resolve Question 5 (resiliency testing approach — project-wide) — B
- [x] Resolve Question 6 (external-call timeout budget — Unit 1) — A
- [x] Resolve Question 7 (retry policy for transient DB errors — Unit 1) — A
- [x] Generate `aidlc-docs/construction/unit-1-auth/nfr-design/nfr-design-patterns.md`
- [x] Generate `aidlc-docs/construction/unit-1-auth/nfr-design/logical-components.md`

## Questions

## Question 1: CI/CD Tooling (project-wide)
What CI/CD tooling should this project use?

A) Use an existing pipeline — provide the tool under Other

B) No pipeline exists yet — propose one appropriate for a Next.js/Vercel app (e.g., GitHub Actions running lint/typecheck/test/coverage-gate on PRs, Vercel's own preview-deploy-per-PR for the deploy step)

X) Other (please describe after [Answer]: tag below)

[Answer]: b

## Question 2: Rollback Mechanism (project-wide)
How should a failed production deployment be rolled back?

A) Redeploy previous version (version-pinned rollback) — Vercel supports instant rollback to any previous deployment natively

B) Blue/green swap

C) Canary auto-rollback on health/metric regression

D) Database-aware rollback required (schema/data migration reversal) — flag for explicit design

E) Existing organizational procedure — describe under Other

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 3: Deployment Style (project-wide)
What deployment strategy fits this workload's risk profile?

A) Direct/in-place — acceptable for non-critical workloads

B) Rolling

C) Blue/green (zero-downtime cutover)

D) Canary (progressive traffic shift with automated rollback)

X) Other (please describe after [Answer]: tag below)

[Answer]: b

## Question 4: Incident Response Process (project-wide)
How should production incidents be handled?

A) Use an existing process — describe under Other

B) No formal process exists — propose a lightweight incident response + Correction-of-Errors (COE) process for a small team to adopt

X) Other (please describe after [Answer]: tag below)

[Answer]: b

## Question 5: Resiliency Testing Approach (project-wide)
How will resiliency mechanisms (failover, recovery, backup restore) be validated?

A) Use an existing DR testing / game-day practice — describe under Other

B) No practice exists — propose a DR testing schedule/chaos-experiment plan for adoption

C) Defer to the Operations phase — capture test scenarios now, execute later

X) Other (please describe after [Answer]: tag below)

[Answer]: b

## Question 6: External-Call Timeout Budget (Unit 1)
RESILIENCY-10 requires explicit timeouts on all external calls (no unbounded waits). What timeout should apply to this unit's external calls (Postgres queries, Google OAuth token exchange)?

A) 5 seconds for both DB queries and the Google OAuth token exchange call

B) Different budgets — describe under Other (e.g., shorter for DB, longer for OAuth)

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 7: Retry Policy for Transient Database Errors (Unit 1)
Should Auth operations retry on transient DB errors (e.g., a momentary connection blip), given Auth is on the critical path for every authenticated request?

A) One retry with a short fixed delay (e.g., 100ms), then fail — balances resilience against a single blip without compounding latency under sustained outage

B) No retries — fail fast and surface the error immediately (simplest; relies on the client/user retrying)

X) Other (please describe after [Answer]: tag below)

[Answer]: a

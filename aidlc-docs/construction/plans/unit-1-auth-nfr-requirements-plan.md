# NFR Requirements Plan — Unit 1: Auth & Accounts

Source: [functional-design/](../unit-1-auth/functional-design/). Project-wide NFR decisions already fixed in requirements.md (Backup & Restore DR, single-region multi-zone, Security/Resiliency/PBT all enabled, fast-check as the PBT framework per NFR-3) are **not** re-asked here — only unit-specific NFR gaps are covered below.

## Execution Checklist

- [x] Resolve Question 1 (password hashing algorithm) — A (bcrypt)
- [x] Resolve Question 2 (login/sign-up performance target) — B (p95 < 500ms sign-in)
- [x] Resolve Question 3 (initial scale assumption / data retention for Session & LoginAttempt tables) — B (scheduled cleanup, 30-day window)
- [x] Generate `aidlc-docs/construction/unit-1-auth/nfr-requirements/nfr-requirements.md`
- [x] Generate `aidlc-docs/construction/unit-1-auth/nfr-requirements/tech-stack-decisions.md`

## Questions

## Question 1: Password Hashing Algorithm
Both are adaptive (SECURITY-12-compliant) algorithms; the choice is a maintainability/ecosystem tradeoff.

A) bcrypt — extremely mature, simplest Node.js library support, slightly weaker against GPU-based attacks than argon2

B) argon2id — winner of the Password Hashing Competition, stronger against GPU/ASIC attacks, marginally more setup (native bindings)

C) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 2: Login/Sign-Up Performance Target
Is there a specific latency target for sign-up/sign-in, or should this be left as "reasonable default, not a hard NFR" for Phase 1?

A) No hard target for Phase 1 — correctness and security take priority; revisit if it's ever user-visibly slow

B) Set an explicit target (e.g., p95 < 500ms for sign-in excluding OAuth redirect round-trip) — describe under Other if you want a different number

X) Other (please describe after [Answer]: tag below)

[Answer]: b

## Question 3: Initial Scale & Data Retention
`Session` and `LoginAttempt` rows accumulate over time. Given this is a pre-launch startup (per requirements.md), what's the right posture for Phase 1?

A) No automated pruning yet — expected volume is low enough that manual/deferred cleanup is fine; revisit if/when it becomes a real table-size concern

B) Build a basic scheduled cleanup (e.g., delete expired `Session` rows and `LoginAttempt` rows older than 30 days) now, since it's cheap to add while building the unit

X) Other (please describe after [Answer]: tag below)

[Answer]: b

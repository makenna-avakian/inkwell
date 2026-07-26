# Infrastructure Design Plan — Unit 1: Auth & Accounts

Unit 1 has little infrastructure of its own (it's part of the single deployed Next.js app, using the shared Postgres instance). Most questions below are genuinely **project-wide** foundational infrastructure choices, being decided now for the first time — answers recorded as project-wide in `aidlc-state.md`, not re-asked for Units 2-6. Question 2 (scheduled job mechanism) is being decided now because Unit 1 is the first unit that needs one (its cleanup job); later units (e.g., Unit 6's payout scheduling) will reuse the same mechanism.

## Execution Checklist

- [x] Resolve Question 1 (managed Postgres provider — project-wide) — B (Neon)
- [x] Resolve Question 2 (scheduled job mechanism — project-wide, first needed by Unit 1) — A (Vercel Cron)
- [x] Resolve Question 3 (environment strategy — project-wide) — B (3 environments)
- [x] Resolve Question 4 (observability/monitoring tooling — project-wide) — A (Vercel + Sentry)
- [x] Generate `aidlc-docs/construction/unit-1-auth/infrastructure-design/infrastructure-design.md`
- [x] Generate `aidlc-docs/construction/unit-1-auth/infrastructure-design/deployment-architecture.md`
- [x] Generate `aidlc-docs/construction/shared-infrastructure.md`

## Questions

## Question 1: Managed Postgres Provider
requirements.md left this as "Supabase or Neon" (either/or). Which one?

A) Supabase — adds built-in auth/storage/realtime if ever useful later, slightly more platform than needed for Phase 1's Auth.js-based approach

B) Neon — Postgres-focused, serverless/branching-friendly, no bundled extras we're not using (we already chose Auth.js over Supabase Auth)

C) Other (please describe after [Answer]: tag below)

[Answer]: b

## Question 2: Scheduled Job Mechanism
Unit 1 needs a scheduled cleanup job (expired Sessions/old LoginAttempts). What should run it?

A) Vercel Cron Jobs — simplest, no extra service, sufficient for a periodic cleanup task; same mechanism can be reused later for Unit 6's payout scheduling

B) A dedicated background-job service (e.g., Inngest, per the original proposal's suggestion) — more capable (retries, observability, event-driven triggers) but an extra service to operate

C) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 3: Environment Strategy
How many deployment environments should exist?

A) Two: development (local) + production (Vercel), using Vercel's automatic preview deployments per PR as the de facto "staging" — no separate persistent staging environment/database

B) Three: development + a persistent staging environment/database + production

C) Other (please describe after [Answer]: tag below)

[Answer]: b

## Question 4: Observability/Monitoring Tooling
RESILIENCY-05/06/07 require metrics, logs, and a monitoring dashboard. What should provide this?

A) Vercel's built-in observability (logs, analytics) + Sentry for error tracking/alerting — no separate APM platform

B) A fuller observability platform (e.g., Datadog, Grafana Cloud) in addition to the above

C) Other (please describe after [Answer]: tag below)

[Answer]: a

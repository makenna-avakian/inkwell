# Shared Infrastructure — Inkwell (Phase 1)

Project-wide infrastructure decisions, made during Unit 1's Infrastructure Design (first unit through this stage). Referenced, not re-decided, by Units 2-6.

| Concern | Choice | Notes |
|---|---|---|
| Hosting | Vercel | Project-wide (requirements.md). Single Next.js app deployment. |
| Managed Postgres | **Neon** | Question 1: B. Serverless/branching Postgres; no bundled auth/storage since Auth.js + a to-be-decided object storage (Unit 2) cover those. |
| Environments | **Development, Staging, Production** (3) | Question 3: B. Staging realized cheaply via a Neon database branch + a separate Vercel project/environment, rather than a fully independent managed Postgres instance. |
| Scheduled jobs | **Vercel Cron Jobs** | Question 2: A. Used first by Unit 1's Session/LoginAttempt cleanup; expected to be reused by Unit 6's payout scheduling. |
| Observability | **Vercel built-in (logs, analytics) + Sentry** (error tracking/alerting) | Question 4: A. Satisfies RESILIENCY-05/06/07's metrics/logs/dashboard requirement without a separate APM platform, appropriate for Phase 1 scale. |
| CI/CD | GitHub Actions + Vercel preview/production deploys | Decided at Unit 1 NFR Design (RESILIENCY-04). |
| DR strategy | Backup & Restore, single-region multi-zone | Decided at Requirements Analysis (RESILIENCY-02/08). Neon's automated point-in-time restore satisfies the backup half of this. |

## Encryption (SECURITY-01)
- Neon Postgres: encryption at rest (managed by Neon) and enforces TLS for all connections (`sslmode=require` in the connection string).
- Vercel: TLS terminates all traffic to the app by default (HTTPS-only, no separate configuration needed for Phase 1).

## Secrets Management
- Stripe keys (Unit 6), Neon connection string, Auth.js secret, Google OAuth client secret: stored as Vercel encrypted environment variables, scoped per environment (development/staging/production) — never committed to source (SECURITY-12).

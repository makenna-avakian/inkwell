# Infrastructure Design — Unit 1: Auth & Accounts

See [shared-infrastructure.md](../../shared-infrastructure.md) for project-wide decisions (hosting, database provider, environments, observability, CI/CD). This document covers Unit 1-specific mappings only.

## Compute
- No dedicated compute — Auth logic runs as part of the single Next.js app on Vercel (Server Actions / Route Handlers), per the project's single-codebase architecture.

## Storage
- `User`, `Session`, `OAuthAccount`, `LoginAttempt` tables live in the shared Neon Postgres instance (see shared-infrastructure.md), managed via Drizzle migrations.

## Scheduled Job
- The Session/LoginAttempt cleanup job (NFR Requirements decision) runs as a Vercel Cron Job, invoking a dedicated Route Handler (e.g., `src/app/api/cron/cleanup-auth/route.ts`) on a daily schedule, protected by a shared secret header so it can't be triggered by arbitrary external requests (SECURITY-08 — not a public/unauthenticated endpoint).

## External Integration
- **Google OAuth**: Auth.js's Google provider, configured with a Google Cloud OAuth client (client ID/secret stored per shared-infrastructure.md's secrets management).

## Networking
- No unit-specific networking configuration — inherits Vercel's default HTTPS-only edge network and Neon's TLS-enforced connection pooling.

## Monitoring
- Sign-in failures, brute-force-protection triggers (BR-6), and any unhandled exceptions in the Auth module are captured by Sentry (shared-infrastructure.md) and routed into the project's lightweight incident-response process (NFR Design decision).

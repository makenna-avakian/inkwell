# API Layer Summary — Unit 1: Auth & Accounts

## Endpoints/Actions
- `src/app/api/auth/[...nextauth]/route.ts` — Auth.js's handlers (sign-in/sign-out/callback/session endpoints), delegating entirely to `src/server/auth/config.ts`.
- `src/app/(auth)/sign-up/actions.ts` (`signUpAction`) — Server Action backing `SignUpForm`. Validates via `signUp()` (Zod), maps known errors to field-level messages, never leaks internal error details (SECURITY-09), auto-signs-in on success.
- `src/app/api/cron/cleanup-auth/route.ts` — `GET`, bearer-secret-protected (`CRON_SECRET`), invoked by Vercel Cron per infrastructure-design.md. Not reachable without the secret (SECURITY-08).

## Tests
- `actions.test.ts` — success path (auto-sign-in), duplicate-email field error, generic-message-on-unexpected-error (verifies no internal details leak).
- `route.test.ts` (cron) — rejects missing/incorrect secret, returns deletion counts on success.

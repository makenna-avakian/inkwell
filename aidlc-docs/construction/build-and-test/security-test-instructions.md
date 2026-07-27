# Security Test Instructions

Security Baseline is enabled project-wide (decided at Requirements Analysis) and enforced per-applicable-rule at each unit's NFR stages. This file lists the checks that carry across the whole app rather than repeating each unit's individual NFR compliance summary.

## Dependency Security
```bash
npm audit
```
Run before any real deployment. As of Unit 6's `npm install` (adding `stripe`), `npm audit` reported 48 existing vulnerabilities in transitive dependencies (27 moderate, 15 high, 6 critical) — pre-existing, not introduced by Unit 6, and `npm audit fix --force` was deliberately not run during construction to avoid unreviewed breaking changes mid-unit. Run `npm audit` for the current, authoritative count and `npm audit fix` (reviewing the diff, not `--force` blindly) before production launch.

## Authentication / Authorization Spot-Checks
- **Password handling**: bcrypt hashing, salted, verified via property-based round-trip tests (`src/server/auth/password.test.ts`) — never logged or returned in any response.
- **Enumeration safety**: sign-in returns a generic error for both "no such user" and "wrong password" (`SignInForm.test.tsx` — "shows a generic error for invalid credentials (enumeration-safe)").
- **Object-level authorization**: every service function that acts on a specific record (shop, listing, request, order) checks the caller against the record's owner/participant before allowing the action — not just that the caller is signed in. Example: Unit 6's `assertParticipant`/`NotOrderParticipantError` in `src/server/orders/service.ts`, tested in `service.test.ts`'s "BR-3 object-level auth" cases.
- **Rate limiting**: login attempts are rate-limited per `src/server/auth/rate-limit.ts` (`rate-limit.test.ts`).
- **Fail-closed defaults**: unexpected auth errors deny access rather than allow it (`SECURITY-15`, `src/server/auth/config.ts`).

## Input Validation
- All Server Action inputs are parsed with Zod schemas at the service-layer boundary (e.g., `createListingSchema` in Unit 3/4, `submitRequest`'s tier/add-on validation in Unit 5).
- Discovery filter/search query params fall back to safe defaults on malformed input rather than reaching the query layer raw (`SECURITY-05`, `src/server/discovery/service.ts`).
- Webhook payloads (Unit 6) are never trusted without Stripe signature verification (`constructWebhookEvent`, `src/server/orders/payment.ts`) — an unsigned or badly-signed request is rejected with 400 before any business logic runs (`route.test.ts`).

## Error Handling
- Server Actions never surface raw error messages/stack traces to the client — only pre-approved, user-facing strings (`SECURITY-09`, `AuthErrorBanner.tsx`, and the `catch (error) { if (error instanceof Error) return { formError: error.message } }` pattern used throughout, where `error.message` is always a message *we* threw, e.g. `OrderValidationError`, never a raw driver/Stripe exception passed through unmodified).

## Protected Endpoints
- `/api/cron/cleanup-auth` requires a bearer-token shared secret (`CRON_SECRET`), not left as an open unauthenticated endpoint (`SECURITY-08`, `route.test.ts`'s 401 cases).
- `/api/webhooks/stripe` requires a valid Stripe signature (`route.test.ts`'s missing-signature and invalid-signature 400 cases) — this is the equivalent protection for a webhook endpoint, where a shared secret isn't the right mechanism.

## What's Out of Scope for Phase 1
- No automated SAST/DAST scanning pipeline is configured yet — this is a manual-review-per-unit process for now (see CI/CD decision in `aidlc-state.md`: lint/typecheck/test/coverage gate only). Flag as a Phase 2 candidate.
- No formal penetration test has been performed.

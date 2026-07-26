# Business Rules — Unit 1: Auth & Accounts

## BR-1: Email Format Validation
Email must match a standard RFC 5322-compatible format. Rejected otherwise with a field-level validation error (SECURITY-05 input validation).

## BR-2: Password Strength
Minimum 8 characters (SECURITY-12 minimum). Checked against a breached-password list (e.g., HaveIBeenPwned range API or an equivalent offline list) at sign-up and password-change time; rejected if found.

## BR-3: Credential Storage
Passwords are hashed with an adaptive algorithm (bcrypt or argon2 — finalized at NFR Design/Code Generation). Plaintext passwords are never logged or persisted (SECURITY-03, SECURITY-12).

## BR-4: Display Name Default
If a user doesn't supply a `displayName` at sign-up, default to the local-part of their email (the substring before `@`). They may change it later.

## BR-5: OAuth/Email Account Linking
If a Google sign-in's verified email matches an existing `User.email`, link the `OAuthAccount` to that existing user rather than creating a duplicate account. This is only safe because Google verifies email ownership — an unverified-email OAuth provider would not get this treatment.

## BR-6: Progressive Delay on Failed Logins
For a given email, each additional failed attempt within a rolling 15-minute window increases the required delay before the next attempt is accepted: 0 for the first 3 failures, then `2^(failureCount-3)` seconds, capped at 60 seconds. The counter resets on a successful login. No permanent lockout — this satisfies SECURITY-12's brute-force-protection requirement (Question 4: A) without the support burden of manual unlock requests.

## BR-7: Session Invalidation
A `Session` row is deleted immediately on sign-out (server-side revocation, not just client cookie clearing) and is also treated as invalid once past `expiresAt`, even if the row hasn't been garbage-collected yet (SECURITY-12).

## BR-8: Seller Capability Is Derived, Not Stored
Whether a user "is a seller" is computed from `ShopProfile` existence (see business-logic-model.md), never stored redundantly on `User`. This guarantees the seller-capability check can never drift out of sync with the actual presence of a shop (Question 1: A).

## BR-9: Fail-Closed Session Resolution
If session lookup fails for any reason (expired, malformed token, DB error), the caller is treated as **unauthenticated** — never silently treated as a valid session (SECURITY-15 fail-safe defaults / fail closed).

---

## PBT-01: Testable Properties (Property-Based Testing extension — enforced)

| Component/Function | Property Category | Property |
|---|---|---|
| `hashPassword` / `verifyPassword` | Round-trip (not exact identity — one-way hash) | `verifyPassword(plaintext, hashPassword(plaintext)) == true` for all valid password strings; `verifyPassword(plaintext, hashPassword(otherPlaintext)) == false` for `plaintext != otherPlaintext` |
| BR-6 progressive delay calculation | Invariant | Required delay is monotonically non-decreasing in `failureCount` within a window, and always `>= 0` and `<= 60` |
| BR-6 progressive delay calculation | Invariant | Delay resets to the "0 for first 3 failures" baseline after any successful login, for all prior `failureCount` values |
| BR-4 display-name default | Invariant | For any valid email, the derived default display name is always non-empty and contains no `@` character |
| Email format validation (BR-1) | Oracle | Validation result matches a reference RFC 5322-subset regex/library for a wide range of generated valid/invalid email strings |
| Session expiry check (BR-7/BR-9) | Invariant | For any `Session` with `expiresAt` in the past, resolution always returns "unauthenticated," regardless of other session fields |

Components with no identified PBT properties: none for this unit — every business rule above that involves a computation (as opposed to pure CRUD/orchestration) has an associated property. Pure CRUD operations (`signUp`, `signIn` orchestration, `signOut`) are covered by example-based tests only, per PBT-10 (property-based tests complement, not replace, example-based tests for business-critical flows).

---

## Security & Resiliency Applicability Note (Functional Design stage)

This stage is technology-agnostic, so most SECURITY/RESILIENCY rules that concern infrastructure (encryption at rest, network config, monitoring dashboards, deployment/DR) are **N/A at this stage** and will be addressed at NFR Design / Infrastructure Design. Rules addressed here at the business-rule level: SECURITY-05 (BR-1), SECURITY-12 (BR-2, BR-3, BR-6, BR-7), SECURITY-15 (BR-9), SECURITY-11 (this entire unit's isolation as a dedicated Auth module *is* the separation-of-concerns control). Full compliance tables are presented in this stage's completion message.

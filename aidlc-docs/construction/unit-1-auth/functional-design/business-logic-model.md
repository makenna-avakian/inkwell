# Business Logic Model — Unit 1: Auth & Accounts

Technology-agnostic business logic (Auth.js is the chosen implementation vehicle, decided at NFR Requirements — not detailed here).

## Core Workflows

### Sign-Up (Email/Password)
1. Validate email format and password strength (see business-rules.md BR-1, BR-2).
2. Check email uniqueness.
3. Hash password (adaptive algorithm — BR-3).
4. Create `User` row (`displayName` defaults to the local-part of the email unless the user supplies one — BR-4).
5. Create a `Session` and return it (auto-sign-in after sign-up).

### Sign-Up / Sign-In (Google OAuth)
1. Receive verified identity from Google via Auth.js's OAuth flow.
2. If an `OAuthAccount` row exists for `(provider='google', providerAccountId)`, sign in as its linked `User`.
3. Otherwise, if a `User` with the same email already exists (e.g., they'd previously signed up with email/password), link the new `OAuthAccount` to that existing `User` rather than creating a duplicate account (BR-5).
4. Otherwise, create a new `User` (no `passwordHash`) and a linked `OAuthAccount`.
5. Create a `Session`.

### Sign-In (Email/Password)
1. Look up `User` by email.
2. Check the progressive-delay gate (BR-6) before attempting password comparison.
3. Record a `LoginAttempt` regardless of outcome (including for unknown emails, to avoid revealing account existence via response-time/behavior differences).
4. On success: create a `Session`.
5. On failure: return a generic "invalid email or password" message (never "email not found" vs. "wrong password" — enumeration prevention).

### Sign-Out
1. Delete the caller's `Session` row.
2. Confirm to the client that the session cookie should be cleared.

### Session Resolution (every authenticated request, used by every other unit)
1. Read the session token from the request's cookie.
2. Look up the `Session` row; if missing or expired, treat the caller as unauthenticated.
3. If a route requires seller capability, derive it by checking for a `ShopProfile` row for the resolved `User.id` (not a stored role) — this is the integration point every other unit's authorization checks call into.

## Seller-Capability Derivation (cross-cutting, used by Units 2–6)

`isSeller(userId)` := `exists(ShopProfile where userId = userId)`.

This function is the single source of truth other units must call — none of them should re-derive or cache "is this user a seller" independently, to avoid the derived state ever drifting from the actual data.

# Functional Design Plan — Unit 1: Auth & Accounts

Source: [unit-of-work.md](../../inception/application-design/unit-of-work.md) (Unit 1), [component-methods.md](../../inception/application-design/component-methods.md) (Auth methods), [requirements.md](../../inception/requirements/requirements.md) (NFR-1 Security).

## Execution Checklist

- [x] Resolve Question 1 (role modeling: buyer/seller as mutually exclusive role vs. layered capability) — A
- [x] Resolve Question 2 (session strategy: database-backed vs. JWT) — A
- [x] Resolve Question 3 (credential methods: email/password, OAuth, or both — and which providers) — B
- [x] Resolve Question 4 (brute-force protection approach, per SECURITY-12) — A
- [x] Resolve Question 5 (minimal profile fields beyond id/email/role/createdAt) — A
- [x] Generate `aidlc-docs/construction/unit-1-auth/functional-design/business-logic-model.md`
- [x] Generate `aidlc-docs/construction/unit-1-auth/functional-design/business-rules.md` (includes PBT-01 Testable Properties section)
- [x] Generate `aidlc-docs/construction/unit-1-auth/functional-design/domain-entities.md`
- [x] Generate `aidlc-docs/construction/unit-1-auth/functional-design/frontend-components.md` (sign-up/sign-in UI)

## Questions

## Question 1: Role Modeling
The proposal's data model says `role ∈ {buyer, seller, admin}` but also "a user can be both buyer and seller" — which is a contradiction if `role` is a single mutually-exclusive field. How should this actually be modeled?

A) `role` is not mutually exclusive for buyer/seller — every signed-up user is implicitly a buyer; "seller" capability is granted the moment they create a `ShopProfile` (Unit 2). No separate seller-role flag needed; `admin` remains a distinct, separately-granted flag/role for the (currently out-of-UI-scope) platform operator.

B) Add an explicit `roles: Set<'buyer'|'seller'|'admin'>` field a user can hold multiple values of, independent of whether a ShopProfile exists.

C) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 2: Session Strategy
Auth.js supports both database-backed sessions (session record in Postgres, can be revoked server-side instantly) and JWT sessions (stateless, faster, but harder to revoke before natural expiry). SECURITY-12 requires sessions to be invalidated on logout.

A) Database-backed sessions — immediate, reliable server-side revocation on logout; small extra DB read per request

B) JWT sessions with a short expiry + refresh pattern — accept that a stolen JWT remains valid until its (short) expiry even after "logout," in exchange for not hitting the DB on every request

C) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 3: Credential Methods for Phase 1
The proposal mentions "Email + OAuth (Google, Apple)." What should Phase 1 actually support?

A) Email/password only for Phase 1; OAuth providers added later

B) Email/password + Google OAuth only (skip Apple for Phase 1 — Apple Sign-In has extra setup/cost overhead)

C) Email/password + Google + Apple, all in Phase 1, as the proposal describes

D) Other (please describe after [Answer]: tag below)

[Answer]: b

## Question 4: Brute-Force Protection
SECURITY-12 requires login endpoints to implement account lockout, progressive delay, or CAPTCHA after repeated failures.

A) Progressive delay (e.g., exponential backoff per failed attempt, no hard lockout) — simplest to implement, no risk of locking out a legitimate user indefinitely

B) Hard account lockout after N failed attempts, requiring password reset or a timeout to unlock

C) CAPTCHA after a threshold of failed attempts

D) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 5: Minimal Profile Fields
Beyond `id`, `email`, `role`, `createdAt` (proposal's minimal model), does the User entity need any additional Phase 1 fields (e.g., a buyer-facing display name, since a seller's public identity is already covered by their separate ShopProfile in Unit 2)?

A) Add `displayName` only (shown when a buyer posts a message/review) — everything else (avatar, bio) stays on ShopProfile for sellers; buyers have no public profile page in Phase 1

B) No additional fields — use the email (or its local-part) as the display identity for Phase 1

C) Other (please describe after [Answer]: tag below)

[Answer]: a

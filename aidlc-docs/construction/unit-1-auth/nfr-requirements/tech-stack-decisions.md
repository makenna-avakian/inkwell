# Tech Stack Decisions — Unit 1: Auth & Accounts

| Concern | Choice | Rationale |
|---|---|---|
| Auth framework | Auth.js (NextAuth) | Project-wide decision (requirements.md). |
| Database adapter | Auth.js Drizzle adapter | Project-wide ORM is Drizzle (requirements.md); avoids introducing a second ORM just for auth tables. |
| Password hashing | bcrypt (`bcryptjs` or native `bcrypt` package) | Question 1: A — mature, simple, adaptive, SECURITY-12-compliant. |
| OAuth provider(s) | Google only (Phase 1) | Question 3 (Functional Design): B. |
| Session strategy | Database sessions (Auth.js `session.strategy = "database"`) | Functional Design Question 2: A — server-side revocation on logout. |
| Validation library | Zod | Project-wide convention (requirements.md NFR-1, SECURITY-05) for all form/API input validation, including sign-up/sign-in payloads. |
| Property-based testing framework | fast-check | Already fixed project-wide (requirements.md NFR-3); confirmed applicable here for the properties identified in `functional-design/business-rules.md`'s PBT-01 table (password hash round-trip, progressive-delay invariants, etc.). |
| Unit/component test framework | Vitest + React Testing Library | Project-wide convention (requirements.md NFR-3). |
| Scheduled cleanup mechanism | Deferred to Infrastructure Design | The *what* (delete expired Sessions + LoginAttempts > 30 days) is fixed in `nfr-requirements.md`; the *how* (cron, serverless scheduled function, etc.) is an infrastructure choice, decided when Unit 1 reaches Infrastructure Design. |

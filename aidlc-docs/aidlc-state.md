# AI-DLC State Tracking

**Combined workflow (superseded)**: This session started as a combined workflow spanning `shareart-frontend` and `shareart-backend`. Per the Application Design decision, all code and Construction-phase artifacts now target **`shareart-frontend` only** — `shareart-backend` is retired (its `aidlc-docs/` pointer files remain for reference but no units target it).

## Project Information
- **Project Type**: Brownfield (`shareart-frontend`, being replaced); `shareart-backend` retired
- **Start Date**: 2026-07-26T00:00:00Z
- **Current Stage**: INCEPTION complete — ready for CONSTRUCTION, Unit 1 (Auth & Accounts)

## Workspace State
- **shareart-frontend**: Existing code (Yes) — a small Next.js 15 personal portfolio site ("Makenna Avakian Art"), no backend/API/DB wired up yet. See `inception/reverse-engineering/`.
- **shareart-backend**: Existing code (No) — empty repo, README only ("Backend for AvakianArt.com").
- **Reverse Engineering Needed**: Yes (frontend, completed) / No (backend, nothing to reverse-engineer)
- **Workspace Root(s)**:
  - `C:\Users\Makenna Avakian\codeprojectz\shareart-frontend`
  - `C:\Users\Makenna Avakian\codeprojectz\shareart-backend`

## Code Location Rules
- **Application Code**: Each repo's own root (NEVER in aidlc-docs/)
- **Documentation**: `aidlc-docs/` only (canonical copy in `shareart-frontend`)
- **Structure patterns**: See `construction/code-generation.md` (once loaded) for patterns by project type

## Extension Configuration
| Extension | Enabled | Decided At |
|---|---|---|
| Security Baseline | Yes | Requirements Analysis |
| Resiliency Baseline | Yes | Requirements Analysis |
| Property-Based Testing | Yes (full enforcement) | Requirements Analysis |

## Stage Progress
### 🔵 INCEPTION PHASE
- [x] Workspace Detection
- [x] Reverse Engineering (shareart-frontend; shareart-backend skipped — genuinely empty)
- [x] Requirements Analysis — `requirements.md` complete, Phase 1/MVP scope confirmed
- [x] User Stories — 40 stories (S-1..S-40) across Seller/Buyer personas, `inception/user-stories/`
- [x] Workflow Planning — `inception/plans/execution-plan.md`, awaiting approval
- [x] Application Design — 9 components, 5 services, dependency map; `inception/application-design/`
- [x] Units Generation — 6 units defined, all 40 stories mapped; `inception/application-design/unit-of-work*.md`

**INCEPTION PHASE COMPLETE.**

### 🟢 CONSTRUCTION PHASE (per unit, in approved sequence — one implementer/session, sequential)
Build sequence: 1. Auth & Accounts → 2. Shops & Commission Rules → 3. Listings → 4. Browse & Discovery → 5. Commission Requests & Messaging → 6. Orders & Payments

- [x] **Unit 1: Auth & Accounts** — COMPLETE (all Construction stages done, verified, committed to `main`)
- [ ] Unit 2: Shops & Commission Rules — Functional Design ✅, NFR Requirements ✅, NFR Design ✅, Infrastructure Design ✅ (awaiting approval) → Code Generation
- [ ] Unit 3: Listings — NOT STARTED
- [ ] Unit 4: Browse & Discovery — NOT STARTED
- [ ] Unit 5: Commission Requests & Messaging — NOT STARTED
- [ ] Unit 6: Orders & Payments — NOT STARTED
- [ ] Build and Test (all units) — NOT STARTED

## Key Decisions Log
- Single Next.js codebase in `shareart-frontend`; `shareart-backend` retired (no code generated there going forward).
- Existing personal portfolio site content is replaced, not migrated.
- Scope for this workflow = Phase 1 (MVP) only.
- Code organization: feature-folder by unit under `src/server/*`, routes/UI only in `src/app/`.
- FR-8 (in-app status badge) added during Application Design; full notifications remain Phase 2.

## Project-Wide Resiliency Process Decisions (decided at Unit 1 NFR Design; applies to all units, not re-asked)
- CI/CD: GitHub Actions (lint/typecheck/test/coverage-gate) + Vercel preview-per-PR and production deploy on merge.
- Rollback: Vercel native version-pinned instant rollback.
- Deployment style: Rolling (realized as Vercel's atomic per-deploy cutover model).
- Incident response: lightweight on-call-is-the-implementer + dated COE notes in `aidlc-docs/operations/` (no formal tooling for Phase 1).
- Resiliency testing: manual "game day" checklist (3 DR scenarios documented in `construction/unit-1-auth/nfr-design/nfr-design-patterns.md`), no automated chaos tooling for Phase 1.

## Project-Wide Infrastructure Decisions (decided at Unit 1 Infrastructure Design; see construction/shared-infrastructure.md)
- Managed Postgres: Neon. Environments: dev/staging/prod (staging via Neon branch). Scheduled jobs: Vercel Cron. Observability: Vercel built-in + Sentry.
- Object storage (decided at Unit 2 NFR Requirements): Cloudflare R2, S3-compatible SDK, next/image for delivery, presigned direct-to-storage uploads.

### 🟡 OPERATIONS PHASE
- [ ] Placeholder

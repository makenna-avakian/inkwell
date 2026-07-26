# NFR Design Patterns — Unit 2: Shops & Commission Rules

## Resilience Patterns

### Timeouts & Retries (RESILIENCY-10)
- R2 presigned-URL generation: 5s timeout, one retry at 100ms then fail (Question 1: A) — same convention as Unit 1's external calls.
- Postgres queries (shop/rules CRUD): same 5s timeout / one-retry convention as Unit 1 (project-wide default, not re-decided per unit).
- The actual image upload (browser → R2) has **no server-side timeout exposure** — it's a direct client-to-storage transfer per NFR Requirements' upload-flow decision; any upload-progress/failure handling is a client-side UX concern (`PortfolioManager`, functional-design/frontend-components.md), not a server resilience concern.

### Circuit Breaking
- Not implemented for R2, consistent with Unit 1's rationale for Google OAuth — a single external dependency at this scale doesn't justify the added complexity. Revisit if Phase 2 traffic makes repeated-failure storms a real risk.

### Fail-Safe Defaults
- If presigned-URL generation fails after its retry, the upload flow surfaces a generic "couldn't start upload, try again" message (SECURITY-09) rather than exposing the R2 SDK's raw error.
- `getPublishedRuleSet` returning "no rules published yet" (business-logic-model.md) for a shop with no `currentVersionId` is itself a fail-safe default — Units 3/4/5 must treat this as a valid, expected state, not an error.

## Security Patterns
- Presigned URLs are generated server-side only, after BR-2 (object-level auth) and BR-7 (content-type/size validation) both pass — a client can never obtain a presigned URL for a shop it doesn't own, or for a disallowed content type.
- `src/server/shops/` isolates all shop/rules logic (SECURITY-11), mirroring Unit 1's module separation.

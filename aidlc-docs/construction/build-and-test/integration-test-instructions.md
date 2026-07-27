# Integration Test Instructions

## Purpose
This is a single Next.js monolith (`shareart-frontend`), not separate deployed services, so "integration" here covers two things: (1) database-backed repository tests, and (2) the cross-unit call chains and UI wiring established across Units 1-6 — verified today primarily by the unit test suite's mocked call-through assertions plus manual smoke testing (below), since there's no separate service boundary to contract-test across.

## Database Integration Test Scenarios

### Scenario 1: Auth (Unit 1) — session and login-attempt lifecycle
- **Setup**: `DATABASE_URL` pointing at a disposable test database
- **Test Steps**: `src/server/auth/repository.test.ts`
- **Expected Results**: user/session/oauth-account CRUD and rate-limit window queries round-trip correctly
- **Cleanup**: `afterEach` truncates the relevant tables

### Scenario 2: Shops (Unit 2) — rule versioning and slot state
- **Test Steps**: `src/server/shops/repository.test.ts`
- **Expected Results**: rule-set publishing correctly persists `maxQueue` (a real bug caught during Unit 2 construction — `publishRuleSet` was calling the wrong repository setter)

### Scenario 3: Listings (Unit 3) / Discovery (Unit 4)
- **Test Steps**: `src/server/listings/repository.test.ts`, `src/server/discovery/repository.test.ts`
- **Expected Results**: filter queries (medium/styleTags added in Unit 4) return only matching, available listings

### Scenario 4: Requests (Unit 5) — waitlist idempotency, active-request counting
- **Test Steps**: `src/server/requests/repository.test.ts`
- **Expected Results**: joining a waitlist twice yields exactly one row (DB-level `onConflictDoNothing`, not just app logic); only `'requested'`-status requests count toward the queue limit

### Scenario 5: Orders (Unit 6) — order lifecycle, webhook idempotency
- **Test Steps**: `src/server/orders/repository.test.ts`
- **Expected Results**: create/read/update round-trip correctly; `markEventProcessed` is idempotent under the DB's unique constraint, not just application logic; `shop_profiles.stripe_connect_account_id` round-trips

## Setup Integration Test Environment

### 1. Provision a Test Database
```bash
# Any disposable Postgres works; a Neon branch is the project's own pattern (see shared-infrastructure.md)
export DATABASE_URL="postgresql://user:pass@host:5432/inkwell_test"
npm run db:migrate
```

### 2. No Additional Service Endpoints
There's nothing else to point at — Stripe/R2 calls in these repository tests are out of scope (they're covered by the mocked service-layer tests in `npm test`, not the DB-integration suites).

## Run Integration Tests

### 1. Execute the DB-Backed Suites
```bash
# with DATABASE_URL set, the describe.skipIf gates lift automatically
npm test
```

### 2. Verify Cross-Unit Wiring (manual smoke test — no automated E2E harness for Phase 1)
Walk the full buyer/seller journey once against a real dev environment (real Stripe test-mode keys, real R2 bucket):
1. Sign up (Unit 1) → create a shop, publish commission rules, upload portfolio images (Unit 2)
2. Complete Stripe Connect onboarding via `StripeOnboardingButton` on `/shop` (Unit 6, gates Unit 2/Unit 5's commission acceptance and Unit 4's buy-now per BR-2)
3. Create a listing (Unit 3); confirm it appears in `/gallery` and `/search` filters (Unit 4)
4. As a second account: submit a commission request (Unit 5) and separately buy a listing via `BuyNowButton` (Unit 6, using a Stripe test card)
5. As the seller: accept the request (Unit 5's `RequestActions` → Unit 6's `acceptAndCreateOrderAction`) and confirm `OrderStatusPanel` appears on `/shop/requests/[id]` and the buyer's `/requests/[id]`
6. As the buyer: complete payment via `OrderStatusPanel`'s "Complete Payment" button, then walk the order through `in_progress → delivered → completed` from both sides, confirming Stripe's manual-capture escrow releases only on `approveDelivery`
7. Confirm the Stripe webhook (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`) fires and reconciles order status independently of the browser (NFR-4)

### 3. Cleanup
```bash
# drop/reset the test database, or discard the Neon test branch
```

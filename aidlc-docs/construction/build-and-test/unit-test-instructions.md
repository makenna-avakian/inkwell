# Unit Test Execution

Covers unit, component, and property-based tests (Vitest + fast-check + React Testing Library) across all 6 units. Repository-layer tests that require a real database use `describe.skipIf(!process.env.DATABASE_URL)` and are skipped by default — see "Integration Tests" below to run those.

## Run Unit Tests

### 1. Execute All Unit Tests
```bash
npm test
```

### 2. Review Test Results
- **Expected**: 168 tests pass, 0 failures, 20 skipped (the `describe.skipIf` DB-integration suites — 6 files, one per unit that owns persisted state: `auth`, `shops`, `listings`, `discovery`, `requests`, `orders`)
- **Test Coverage**: 80% gate (`npm run test:coverage`) per `requirements.md` NFR-3
- **Test Report Location**: terminal output; `coverage/` directory when run with `test:coverage`

### 3. Fix Failing Tests
If tests fail:
1. Review the Vitest failure output — it names the file, test, and assertion
2. Common cause after adding/changing a Drizzle schema field: a hand-written mock object elsewhere in the suite (e.g. a shared `const SHOP = {...}` fixture) is now missing that field and needs updating — `tsc --noEmit` catches these before `vitest` does
3. Fix the code or the test, rerun `npm test` until clean

## Property-Based Tests (fast-check)

Every unit's pure business-rule functions are property-tested per the project-wide Property-Based Testing extension (full enforcement, decided at Requirements Analysis). Examples: Unit 1's password hash/verify round-trip, Unit 5's queue auto-close threshold and waitlist idempotency, Unit 6's order-transition table exhaustiveness and fee-computation no-rounding-leak invariant. These run as part of `npm test` — no separate command.

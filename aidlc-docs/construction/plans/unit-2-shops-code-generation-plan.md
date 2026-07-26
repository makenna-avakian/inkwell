# Code Generation Plan — Unit 2: Shops & Commission Rules

## Unit Context

- **Stories implemented**: S-2 through S-12 (per unit-of-work-story-map.md).
- **Dependencies**: Unit 1 (Auth — session resolution, object-level auth checks).
- **Cross-unit integration**: implements `isSeller(userId)` and wires it back into the existing `src/server/auth/service.ts` (modifying, not duplicating, per code-generation.md's brownfield rule).
- **Database entities owned**: `shop_profiles`, `portfolio_images`, `commission_rule_versions`, `shop_commission_settings`.
- **Code organization**: `src/server/shops/`.

## Steps

- [x] **Step 1: Project Structure Setup** — add `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`; add R2 env vars to `.env.example`; update `next.config.ts` with `images.remotePatterns` for the R2 custom domain.
- [x] **Step 2: Database Schema & Migration** — extend `src/server/db/schema.ts` with `shopProfiles`, `portfolioImages`, `commissionRuleVersions`, `shopCommissionSettings`; add `drizzle/0001_unit2_shops_schema.sql` (illustrative, same caveat as Unit 1's initial migration).
- [x] **Step 3: Business Logic Generation** — `src/server/shops/repository.ts`, `src/server/shops/blocks.ts` (content-block validation/serialization), `src/server/shops/versioning.ts` (next-version computation), `src/server/shops/storage.ts` (R2 presigned URL generation), `src/server/shops/service.ts` (createShop, updateShop, addPortfolioImage orchestration, publishRuleSet, setSlotState, `isSeller`).
- [x] **Step 4: Business Logic Unit + Property-Based Testing** — `blocks.test.ts` (round-trip PBT), `versioning.test.ts` (invariant PBT), `service.test.ts` (example-based).
- [x] **Step 5: Business Logic Summary** — `aidlc-docs/construction/unit-2-shops/code/business-logic-summary.md`.
- [x] **Step 6: Cross-Unit Integration** (also fixed a real bug found while implementing this step: `src/server/db/client.ts` threw at import time if `DATABASE_URL` was unset, which would have broken every test importing `auth/service.ts` now that it transitively imports `shops/repository.ts` → `db/client.ts`. Fixed with a placeholder-connection-string fallback so import never throws; only actual queries would fail without a real `DATABASE_URL`.) — modify `src/server/auth/service.ts` to import and re-export `isSeller` from `src/server/shops/service.ts`, resolving Unit 1's forward reference; add a regression test confirming the re-export works.
- [x] **Step 7: API Layer Generation** — Server Actions: `src/app/(seller)/shop/actions.ts` (createShop, updateShop, requestPortfolioUploadUrl, confirmPortfolioImage), `src/app/(seller)/shop/rules/actions.ts` (publishRuleSet, setSlotState).
- [x] **Step 8: API Layer Unit Testing** — corresponding `.test.ts` files, auth/ownership-check paths included.
- [x] **Step 9: API Layer Summary** — `aidlc-docs/construction/unit-2-shops/code/api-layer-summary.md`.
- [x] **Step 10: Repository Layer Generation** — (implemented as part of Step 3's `repository.ts`; this step verifies coverage of all four tables and finalizes query shapes).
- [x] **Step 11: Repository Layer Unit Testing** — `repository.test.ts`, `describe.skipIf(!process.env.DATABASE_URL)` integration tests, same pattern as Unit 1.
- [x] **Step 12: Repository Layer Summary** — `aidlc-docs/construction/unit-2-shops/code/repository-layer-summary.md`.
- [x] **Step 13: Frontend Components Generation** — `ShopProfileForm.tsx`, `PortfolioManager.tsx`, `CommissionRulesEditor.tsx` (+ `TierListEditor.tsx`, `AddOnListEditor.tsx`, `BlockEditor.tsx`), `SlotStateSelector.tsx`, and pages `src/app/(seller)/shop/new/page.tsx`, `src/app/(seller)/shop/page.tsx`, `src/app/(seller)/shop/rules/page.tsx`.
- [x] **Step 14: Frontend Components Unit Testing** — component tests for each, mocking Server Actions per Unit 1's established pattern.
- [x] **Step 15: Frontend Components Summary** — `aidlc-docs/construction/unit-2-shops/code/frontend-components-summary.md`.
- [x] **Step 16: Database Migration Scripts** — finalize `drizzle/0001_unit2_shops_schema.sql`.
- [x] **Step 17: Documentation Generation** — update `README.md`'s "Current Status" section.
- [x] **Step 18: Deployment Artifacts Generation** — no new CI/deploy config needed beyond Step 1's `next.config.ts`/`.env.example` updates (R2 credentials are environment variables, not new pipeline steps).

## Story Traceability
- S-2..S-4 (shop profile, portfolio) → Steps 3, 7, 13.
- S-5, S-6, S-9..S-12 (rules, tiers, add-ons, slot state) → Steps 3, 7, 13.

This plan is the single source of truth for Unit 2 Code Generation.

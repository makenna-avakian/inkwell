# Code Generation Plan — Unit 4: Browse & Discovery

## Unit Context
- **Stories**: S-25..S-29.
- **Dependencies**: Units 1-3 (reads their data/functions directly: `getShopPortfolio`, `getPublishedRuleSet` from Unit 2; `listAvailableListingsForShop` from Unit 3).
- **Modifies**: Unit 3's `Listing` schema (adds `medium`/`styleTags`) and `src/server/listings/service.ts` (extends `createListingSchema`/`updateListing`); Unit 3's `ListingEditForm`/`ListingManager` gain the two new fields.
- **Database entities owned**: none new — extends `listings`.
- **Code organization**: `src/server/discovery/`.

## Steps

- [x] **Step 1: Project Structure Setup** — no new dependencies.
- [x] **Step 2: Database Schema & Migration** — add `medium`/`styleTags` to `listings` in `schema.ts`; add indexes; `drizzle/0003_unit4_discovery_schema.sql`.
- [x] **Step 3: Cross-Unit Integration (Unit 3 extension)** — extend `src/server/listings/service.ts`'s `createListingSchema` and `updateListing`/`createListing` to accept `medium`/`styleTags`; extend `ListingManager.tsx`/`ListingEditForm.tsx` with the two new fields.
- [x] **Step 4: Business Logic Generation** — `src/server/discovery/repository.ts` (browseFeed query, searchShops query, getShopPageData query), `src/server/discovery/filters.ts` (pure filter-matching functions for PBT), `src/server/discovery/service.ts` (orchestration, Zod validation of filter/search params).
- [x] **Step 5: Business Logic Unit + Property-Based Testing** — `filters.test.ts` (PBT for price range/style-tag/commission-availability invariants, pagination completeness).
- [x] **Step 6: Business Logic Summary**.
- [x] **Step 7: Frontend Components Generation** — `BrowseFeed.tsx`, `FilterPanel.tsx`, `ListingCard.tsx`, `Pagination.tsx`, `ShopSearch.tsx`, `SearchBar.tsx`, `PublicShopPage.tsx`, `BlockRenderer.tsx`; pages `src/app/gallery/page.tsx`, `src/app/search/page.tsx`, `src/app/shops/[shopId]/page.tsx`.
- [x] **Step 8: Frontend Components Unit Testing**.
- [x] **Step 9: Frontend Components Summary**.
- [x] **Step 10: Repository Layer Unit Testing** — `repository.test.ts`, `describe.skipIf`, same pattern as Units 1-3, including a test that the `medium`/`styleTags` extension round-trips through Unit 3's `createListing`.
- [x] **Step 11: Repository Layer Summary**.
- [x] **Step 12: Database Migration Scripts** — finalize `drizzle/0003_unit4_discovery_schema.sql`.
- [x] **Step 13: Documentation Generation** — README Current Status update.
- [x] **Step 14: Deployment Artifacts Generation** — none needed.

This plan is the single source of truth for Unit 4 Code Generation.

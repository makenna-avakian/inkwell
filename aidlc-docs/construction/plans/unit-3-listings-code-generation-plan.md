# Code Generation Plan — Unit 3: Listings

## Unit Context
- **Stories**: S-13, S-14.
- **Dependencies**: Unit 1 (Auth), Unit 2 (ShopProfile, `assertOwner` pattern, `storage.ts`).
- **Database entities owned**: `listings`, `listing_images`.
- **Code organization**: `src/server/listings/`.

## Steps

- [x] **Step 1: Project Structure Setup** — no new dependencies needed.
- [x] **Step 2: Database Schema & Migration** — extend `schema.ts` with `listings`, `listingImages`; `drizzle/0002_unit3_listings_schema.sql`.
- [x] **Step 3: Business Logic Generation** — `src/server/listings/repository.ts`, `src/server/listings/service.ts` (createListing, updateListing, addListingImage, setListingStatus, getListing; reuses Unit 2's `assertOwner`-equivalent via shop lookup, and Unit 2's `storage.ts` directly for uploads).
- [x] **Step 4: Business Logic Unit + Property-Based Testing** — `service.test.ts` with PBT for price validation and position/status invariants.
- [x] **Step 5: Business Logic Summary**.
- [x] **Step 6: API Layer Generation** — Server Actions under `src/app/(seller)/shop/listings/actions.ts`.
- [x] **Step 7: API Layer Unit Testing**.
- [x] **Step 8: API Layer Summary**.
- [x] **Step 9: Repository Layer Unit Testing** — `repository.test.ts`, `describe.skipIf(!process.env.DATABASE_URL)`, same pattern as Units 1/2.
- [x] **Step 10: Repository Layer Summary**.
- [x] **Step 11: Frontend Components Generation** — `ListingManager.tsx`, `ListingEditForm.tsx`, pages `src/app/(seller)/shop/listings/page.tsx` and `[id]/page.tsx`.
- [x] **Step 12: Frontend Components Unit Testing**.
- [x] **Step 13: Frontend Components Summary**.
- [x] **Step 14: Database Migration Scripts** — finalize `drizzle/0002_unit3_listings_schema.sql`.
- [x] **Step 15: Documentation Generation** — update README's Current Status.
- [x] **Step 16: Deployment Artifacts Generation** — none needed (no new infra).

This plan is the single source of truth for Unit 3 Code Generation.

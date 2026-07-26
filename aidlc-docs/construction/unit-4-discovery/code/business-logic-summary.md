# Business Logic Summary — Unit 4: Browse & Discovery

## Files
- `src/server/discovery/filters.ts` — pure predicates (price range, style-tag overlap, commission availability) and in-memory pagination. SQL-cheap filters (status, medium) run in Postgres; these run on the SQL-narrowed candidate set, which is a deliberate design choice for Phase 1 scale (see repository.ts's top comment).
- `src/server/discovery/repository.ts` — `findAvailableListingCandidates` (joined query), `searchShopsQuery` (raw-SQL Postgres full-text search, since bio/displayName span two tables), `findShopProfileWithOwnerName`.
- `src/server/discovery/service.ts` — `browseFeed`, `searchShops` (fail-safe: invalid query returns empty results, never an error), `getShopPageData` (returns `null`, not an error, for a nonexistent shop).

## Cross-Unit Extension (Step 3)
- `src/server/listings/service.ts`'s `createListingSchema` extended with `medium`/`styleTags`; `src/server/listings/repository.ts`'s `updateListingRow` patch type extended to match.

## Tests
- `filters.test.ts` — PBT-01 properties for all four pure functions (price range, style-tag overlap, commission availability, pagination completeness/totalCount correctness).

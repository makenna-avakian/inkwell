# Repository Layer Summary — Unit 4: Browse & Discovery

## File
`src/server/discovery/repository.ts` — `findAvailableListingCandidates` (joined query across listings/shops/users/settings), `searchShopsQuery` (raw-SQL Postgres full-text search), `findShopProfileWithOwnerName`.

## Tests
`repository.test.ts` — integration tests, `describe.skipIf(!process.env.DATABASE_URL)`. Covers: medium filtering, status exclusion (sold listings don't appear), and full-text search actually finding a shop by bio content.

`drizzle/0003_unit4_discovery_schema.sql` is illustrative, same caveat as prior units.

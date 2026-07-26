# Repository Layer Summary — Unit 3: Listings

## File
`src/server/listings/repository.ts` — Drizzle queries for `listings`/`listing_images`, plus `findListingWithShopOwner` (joined lookup for authorization).

## Tests
`repository.test.ts` — integration tests, `describe.skipIf(!process.env.DATABASE_URL)`. Covers: default status on creation, status filtering in `listAvailableListingsForShop` (a `sold` listing is correctly excluded), image position ordering.

`drizzle/0002_unit3_listings_schema.sql` is illustrative, same caveat as Units 1/2.

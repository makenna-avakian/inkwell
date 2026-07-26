# Business Logic Summary — Unit 3: Listings

## Files
- `src/server/listings/repository.ts` — Drizzle queries for `listings`/`listing_images`, including a joined `findListingWithShopOwner` lookup for authorization.
- `src/server/listings/service.ts` — createListing, updateListing, addListingImage/confirmListingImage, setListingStatus, getListing. Reuses `src/server/shops/storage.ts` directly for uploads (BR-5) rather than duplicating it.

## Tests
- `service.test.ts` — example tests + PBT-01 (price non-negativity invariant, exhaustive status-transition coverage), object-level authorization (non-owner rejection).

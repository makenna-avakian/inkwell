# Business Logic Model — Unit 3: Listings

## Create Listing
1. Caller must be the shop's owner (object-level auth, same `assertOwner` pattern as Unit 2 — reused, not reimplemented, since Listing also belongs to a shop).
2. Validate title (non-empty) and price (non-negative — BR-1).
3. Insert `Listing` row with `status = 'available'`.

## Add Listing Image
1. Owner-only.
2. Same R2 presigned-upload flow as Unit 2's portfolio images (reuses `src/server/shops/storage.ts`'s `createPresignedUpload`/`validateImageUpload` directly rather than duplicating it — Listings and Shops share the same image-upload infrastructure).
3. Insert `ListingImage` row with the next `position`.

## Edit Listing
1. Owner-only.
2. Update title/description/price; does not touch `status`.

## Mark Sold / Remove Listing
1. Owner-only.
2. `markSold`: `status = 'sold'`.
3. `remove`: `status = 'removed'` (Question 1: A — soft, not a hard delete).
4. Both are one-way from `available` in normal operation, but no hard state-machine enforcement — an owner correcting a mistake (e.g., accidentally marked sold) can set status back to `'available'`, consistent with Unit 2's slot-state philosophy (BR-6: operational toggles, not a rigid workflow).

## Read Path (used by Units 4 and 6)
- `getListing(listingId)` — returns the listing regardless of status (Unit 6 needs to read a `'sold'` listing to complete an order referencing it).
- `getAvailableListingsForShop(shopId)` / discovery-feed queries (Unit 4) filter to `status = 'available'` only.

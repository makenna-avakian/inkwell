# Business Logic Model — Unit 4: Browse & Discovery

## browseFeed(filters, page)
1. Query `available` Listings, joined to `ShopProfile` (for `shopDisplayName`... actually `displayName` lives on `User`, so joined further to `users`) and `ShopCommissionSettings` (for `shopSlotState`), and the first `ListingImage` by position.
2. Apply filters:
   - `medium` — exact match if provided.
   - `styleTags` — listing matches if it has at least one tag in the requested set (array-overlap).
   - `priceRange` — `priceCents BETWEEN min AND max`.
   - `commissionAvailable` — when true, only include listings whose shop's `slotState` is `'open'` or `'waitlist'` (Question 4: B).
3. Paginate offset/page-based (Question 3: A) — page size fixed at 24 per page for Phase 1.
4. Return `FeedItem[]` plus total count for pagination UI.

## searchShops(query, page)
1. Full-text search (Question 2: B) via `to_tsvector('english', coalesce(shop_profiles.bio,'') || ' ' || coalesce(users.display_name,''))` matched against `plainto_tsquery('english', query)`, computed at query time (not a stored generated column, since the source fields span two tables — a Postgres limitation, not a design choice).
2. Ranked by `ts_rank`.
3. Paginated the same way as `browseFeed`.

## getShopPageData(shopId)
1. Fetch `ShopProfile` + `User.displayName` (join).
2. Fetch portfolio images via Unit 2's `getShopPortfolio` (reused, not reimplemented).
3. Fetch published rules via Unit 2's `getPublishedRuleSet` (reused) — may be `null` (shop hasn't published yet; Unit 4 must render this gracefully, per Unit 2's NFR design's fail-safe-default note).
4. Fetch available listings via Unit 3's `listAvailableListingsForShop` (reused).
5. Returns `404`-equivalent (`null`) if no `ShopProfile` exists for the given ID — a buyer navigating to a stale/invalid shop URL sees a normal "not found" page, not an error.

## searchShopsByArtistName vs. searchShops
Story S-27 says "search by artist name or shop" — covered by the same `searchShops` function above (display name is part of the searched text), not a separate function.

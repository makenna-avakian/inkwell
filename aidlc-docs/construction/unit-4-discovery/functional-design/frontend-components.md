# Frontend Components — Unit 4: Browse & Discovery

**Scope note**: Unlike Units 2/3 (seller-facing only), this unit builds the **public-facing** UI — the buyer-facing views that Units 2/3 deliberately deferred (per their own frontend-components.md scope notes).

## Routes
```
src/app/gallery/page.tsx          -> <BrowseFeed />  (replaces the old removed personal-site gallery page, now the real marketplace feed)
src/app/search/page.tsx           -> <ShopSearch />
src/app/shops/[shopId]/page.tsx   -> <PublicShopPage />
```

## BrowseFeed
- **Props**: none (reads filters from URL search params, so filtered views are shareable/bookmarkable links).
- **Sub-components**: `FilterPanel` (medium select, style-tag multi-select, price range slider, commission-availability toggle), `ListingCard` (image, title, price, shop name + slot-state badge), `Pagination`.
- **Data**: calls `browseFeed` (Server Component data fetch, no client-side loading spinner needed for the initial page).

## ShopSearch
- **Props**: none (query from URL search param `?q=`).
- **Sub-components**: `SearchBar` (client component, debounced input updating the URL), `ShopSearchResultCard`.

## PublicShopPage
- **Props**: `shopId` (route param).
- **Renders**: banner, avatar, bio, social links, portfolio grid (reusing the same image display pattern as Unit 2's `PortfolioManager`, but read-only — no upload controls), published commission rules (rendered from the block schema — a `BlockRenderer` component, the read-only counterpart to Unit 2's `BlockEditor`), current slot-state badge, and available listings grid (reusing `ListingCard`).
- **Not found**: renders Next.js's `notFound()` page if `getShopPageData` returns null (BR from business-logic-model.md).

## BlockRenderer (new, shared read-only component)
- **Props**: `blocks: ContentBlock[]` (Unit 2's block schema).
- Renders each block type (heading/paragraph/bulletList/image) as static HTML — the read-only counterpart to Unit 2's `BlockEditor`, imported by `PublicShopPage`.

## Automation-Friendly Attributes
`data-testid`s follow the established convention (e.g., `browse-feed-filter-panel`, `listing-card-{listingId}`, `shop-search-input`).

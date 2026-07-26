# Frontend Components Summary — Unit 4: Browse & Discovery

## Created
- `src/app/components/discovery/BrowseFeed.tsx`, `FilterPanel.tsx`, `ListingCard.tsx`, `Pagination.tsx`, `SearchBar.tsx`, `ShopSearch.tsx`, `BlockRenderer.tsx`, `PublicShopPage.tsx`
- `src/app/gallery/page.tsx`, `src/app/search/page.tsx`, `src/app/shops/[shopId]/page.tsx`

## Modified
- `src/app/components/Navbar.tsx` — added Browse/Search links (always visible) and a "My shop" link for signed-in users, replacing Unit 1's placeholder comment about marketplace links coming later.

## This Unit Delivers the Public-Facing Site
As scoped in functional-design/frontend-components.md, Units 2/3 built only seller-facing tooling — this is the first unit with real buyer-facing pages, finally giving the marketplace a public front door.

## Tests
`BlockRenderer.test.tsx`, `Pagination.test.tsx` (page-boundary rendering), `FilterPanel.test.tsx` (URL navigation with query params), `BrowseFeed.test.tsx` (empty state + listing rendering, service layer mocked).

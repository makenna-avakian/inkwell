# Frontend Components — Unit 3: Listings

**Scope note**: Same as Unit 2 — seller-facing management UI only. The public browse/listing-detail view is Unit 4's responsibility.

## Routes
```
src/app/(seller)/shop/listings/page.tsx       -> <ListingManager />  (list + create)
src/app/(seller)/shop/listings/[id]/page.tsx  -> <ListingEditForm /> (edit + images + status)
```

## ListingManager
- **Props**: `shopId: string`.
- **State**: existing listings list, new-listing form state.
- **Interactions**: create → `createListingAction`; navigate to a listing's edit page.

## ListingEditForm
- **Props**: `listing: Listing`.
- **State**: `title`, `description`, `priceCents`, `status`.
- **Sub-components**: reuses `PortfolioManager`'s upload flow pattern (a thin `ListingImageManager` wrapping the same presigned-upload UX, parameterized by listing instead of shop) — not a copy-paste duplicate, but styled the same way for consistency.
- **Interactions**: save → `updateListingAction`; status buttons ("Mark Sold", "Remove", "Restore to Available") → `setListingStatusAction`.

## Automation-Friendly Attributes
`data-testid`s follow the established convention (e.g., `listing-edit-form-price-input`, `listing-edit-form-mark-sold-button`).

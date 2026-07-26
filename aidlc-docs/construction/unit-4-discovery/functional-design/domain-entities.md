# Domain Entities — Unit 4: Browse & Discovery

Discovery owns **no new tables** — it's a read layer over Units 1-3's data, plus one schema addition to Unit 3's `Listing` (Question 1: A).

## Schema Addition: `Listing.medium` / `Listing.styleTags` (modifies Unit 3's table)

| Field | Type | Notes |
|---|---|---|
| `medium` | text, nullable | Freeform (e.g., "Watercolor", "Charcoal", "Digital"). Nullable so existing Unit 3 listings aren't broken by this addition. |
| `styleTags` | jsonb, default `[]` | Array of freeform strings (e.g., `["pet portrait", "landscape"]`). |

**Consequence for Unit 3**: `ListingEditForm` (Unit 3) gains two new fields for these — a small, additive change to an already-shipped unit, not a redesign. `createListingSchema`/`updateListing` in `src/server/listings/service.ts` are extended, not replaced.

## Read Models (no new tables, computed/joined at query time)

### FeedItem (browseFeed's output shape)
```ts
interface FeedItem {
  listingId: string;
  title: string;
  priceCents: number;
  medium: string | null;
  styleTags: string[];
  imageUrl: string | null; // first ListingImage by position
  shopId: string;
  shopDisplayName: string;
  shopSlotState: "open" | "closed" | "waitlist";
}
```

### ShopSearchResult (searchShops' output shape)
```ts
interface ShopSearchResult {
  shopId: string;
  displayName: string;
  bio: string | null;
  avatarImageUrl: string | null;
}
```

### ShopPageData (getShopPageData's output shape — the public shop page's data, per S-28/S-29)
```ts
interface ShopPageData {
  shop: { id, displayName, bio, bannerImageUrl, avatarImageUrl, socialLinks };
  portfolio: PortfolioImage[]; // from Unit 2
  publishedRules: PublishedRuleSet | null; // from Unit 2's getPublishedRuleSet
  availableListings: Listing[]; // from Unit 3's listAvailableListingsForShop
}
```

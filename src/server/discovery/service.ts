import { z } from "zod";
import {
  findAvailableListingCandidates,
  findShopProfileWithOwnerName,
  getCompletedOrderCountsByListingId,
  searchShopsQuery,
} from "@/server/discovery/repository";
import { matchesFeedFilters, paginate, type Page } from "@/server/discovery/filters";
import { getGalleryWallSettings, getPublishedRuleSet, getShopPortfolio } from "@/server/shops/service";
import { listAvailableListingsForShop } from "@/server/listings/repository";

/** SECURITY-05: validated filter/search params — malformed input falls back
 *  to safe defaults (BR: fail-safe default) rather than reaching the query layer raw. */
export const browseFeedFiltersSchema = z.object({
  medium: z.string().optional(),
  styleTags: z.array(z.string()).default([]),
  priceMinCents: z.number().int().nonnegative().optional(),
  priceMaxCents: z.number().int().nonnegative().optional(),
  commissionAvailableOnly: z.boolean().default(false),
  sort: z.enum(["newest", "popular", "price-asc", "price-desc"]).default("newest"),
  page: z.number().int().positive().default(1),
});

export type BrowseFeedFilters = z.infer<typeof browseFeedFiltersSchema>;

export async function browseFeed(rawFilters: unknown) {
  const filters = browseFeedFiltersSchema.parse(rawFilters ?? {});

  const candidates = await findAvailableListingCandidates(filters.medium);
  const availableTags = Array.from(new Set(candidates.flatMap((c) => c.styleTags))).sort();

  const filtered = candidates.filter((item) =>
    matchesFeedFilters(item, {
      priceMinCents: filters.priceMinCents,
      priceMaxCents: filters.priceMaxCents,
      styleTags: filters.styleTags,
      commissionAvailableOnly: filters.commissionAvailableOnly,
    }),
  );

  const orderCounts = await getCompletedOrderCountsByListingId();
  const withOrderCount = filtered.map((item) => ({
    ...item,
    orderCount: orderCounts[item.listingId] ?? 0,
  }));

  const sorted = sortFeedItems(withOrderCount, filters.sort);

  return { ...paginate(sorted, filters.page), availableTags };
}

function sortFeedItems<T extends { priceCents: number; createdAt: Date; orderCount: number }>(
  items: T[],
  sort: BrowseFeedFilters["sort"],
): T[] {
  const copy = [...items];
  switch (sort) {
    case "price-asc":
      return copy.sort((a, b) => a.priceCents - b.priceCents);
    case "price-desc":
      return copy.sort((a, b) => b.priceCents - a.priceCents);
    case "popular":
      return copy.sort(
        (a, b) => b.orderCount - a.orderCount || b.createdAt.getTime() - a.createdAt.getTime(),
      );
    case "newest":
    default:
      return copy.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export const searchQuerySchema = z.object({
  query: z.string().trim().min(1).max(200),
  page: z.number().int().positive().default(1),
});

export async function searchShops(rawInput: unknown): Promise<Page<ReturnType<typeof formatSearchRow>>> {
  const parsed = searchQuerySchema.safeParse(rawInput);
  // Fail-safe default: an invalid/empty query returns an empty result set,
  // never a thrown error (nfr-design-patterns.md).
  if (!parsed.success) {
    return { items: [], page: 1, pageSize: 24, totalCount: 0 };
  }

  const rows = await searchShopsQuery(parsed.data.query);
  return paginate(rows.map(formatSearchRow), parsed.data.page);
}

function formatSearchRow(row: Awaited<ReturnType<typeof searchShopsQuery>>[number]) {
  return {
    shopId: row.shopId,
    displayName: row.displayName,
    bio: row.bio,
    avatarImageUrl: row.avatarImageUrl,
  };
}

export interface ShopPageData {
  shop: {
    id: string;
    userId: string;
    displayName: string;
    bio: string | null;
    bannerImageUrl: string | null;
    avatarImageUrl: string | null;
    socialLinks: unknown;
  };
  portfolio: Awaited<ReturnType<typeof getShopPortfolio>>;
  publishedRules: Awaited<ReturnType<typeof getPublishedRuleSet>>;
  availableListings: Awaited<ReturnType<typeof listAvailableListingsForShop>>;
  galleryWallSettings: Awaited<ReturnType<typeof getGalleryWallSettings>>;
}

/** Returns null (not a thrown error) for a nonexistent shop — BR-5 / business-logic-model.md. */
export async function getShopPageData(shopId: string): Promise<ShopPageData | null> {
  const shop = await findShopProfileWithOwnerName(shopId);
  if (!shop) return null;

  const [portfolio, publishedRules, availableListings, galleryWallSettings] = await Promise.all([
    getShopPortfolio(shopId),
    getPublishedRuleSet(shopId),
    listAvailableListingsForShop(shopId),
    getGalleryWallSettings(shopId),
  ]);

  return { shop, portfolio, publishedRules, availableListings, galleryWallSettings };
}

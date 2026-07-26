/**
 * Pure filter predicates — the executable specification for browseFeed's
 * filtering rules (business-rules.md BR-3, BR-6). SQL-cheap filters (status,
 * medium, price range) are applied in repository.ts; these predicates
 * handle the parts that are awkward to express as simple SQL predicates
 * (style-tag overlap, commission-availability across two joined states) and
 * are applied to the SQL-narrowed candidate set before in-memory pagination.
 */

export function isWithinPriceRange(
  priceCents: number,
  min: number | undefined,
  max: number | undefined,
): boolean {
  if (min !== undefined && priceCents < min) return false;
  if (max !== undefined && priceCents > max) return false;
  return true;
}

/** BR-6: matches if there is at least one tag in common. Empty filter set matches everything. */
export function hasStyleTagOverlap(listingTags: string[], filterTags: string[]): boolean {
  if (filterTags.length === 0) return true;
  return listingTags.some((tag) => filterTags.includes(tag));
}

/** BR-3: 'open' or 'waitlist' both count as commission-available. */
export function isCommissionAvailable(slotState: "open" | "closed" | "waitlist"): boolean {
  return slotState === "open" || slotState === "waitlist";
}

export interface FeedFilterInput {
  priceMinCents?: number;
  priceMaxCents?: number;
  styleTags?: string[];
  commissionAvailableOnly?: boolean;
}

export interface FilterableFeedItem {
  priceCents: number;
  styleTags: string[];
  shopSlotState: "open" | "closed" | "waitlist";
}

/** Combines the three predicates above into the full feed-filter spec. */
export function matchesFeedFilters<T extends FilterableFeedItem>(
  item: T,
  filters: FeedFilterInput,
): boolean {
  if (!isWithinPriceRange(item.priceCents, filters.priceMinCents, filters.priceMaxCents)) {
    return false;
  }
  if (!hasStyleTagOverlap(item.styleTags, filters.styleTags ?? [])) {
    return false;
  }
  if (filters.commissionAvailableOnly && !isCommissionAvailable(item.shopSlotState)) {
    return false;
  }
  return true;
}

const PAGE_SIZE = 24; // BR-4

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

/** Pure in-memory pagination over an already-filtered array (BR-4, offset/page-based). */
export function paginate<T>(items: T[], page: number): Page<T> {
  const start = (page - 1) * PAGE_SIZE;
  return {
    items: items.slice(start, start + PAGE_SIZE),
    page,
    pageSize: PAGE_SIZE,
    totalCount: items.length,
  };
}

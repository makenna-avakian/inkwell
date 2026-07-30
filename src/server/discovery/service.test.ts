import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/discovery/repository", () => ({
  findAvailableListingCandidates: vi.fn(),
  findShopProfileWithOwnerName: vi.fn(),
  searchShopsQuery: vi.fn(),
  getCompletedOrderCountsByListingId: vi.fn(),
}));
vi.mock("@/server/shops/service", () => ({
  getPublishedRuleSet: vi.fn(),
  getShopPortfolio: vi.fn(),
  getGalleryWallSettings: vi.fn(),
}));
vi.mock("@/server/listings/repository", () => ({
  listAvailableListingsForShop: vi.fn(),
}));

import {
  findAvailableListingCandidates,
  findShopProfileWithOwnerName,
  getCompletedOrderCountsByListingId,
  searchShopsQuery,
} from "@/server/discovery/repository";
import { getGalleryWallSettings, getPublishedRuleSet, getShopPortfolio } from "@/server/shops/service";
import { listAvailableListingsForShop } from "@/server/listings/repository";
import { browseFeed, getShopPageData, searchShops } from "@/server/discovery/service";

const mockFindAvailableListingCandidates = vi.mocked(findAvailableListingCandidates);
const mockFindShopProfileWithOwnerName = vi.mocked(findShopProfileWithOwnerName);
const mockGetCompletedOrderCountsByListingId = vi.mocked(getCompletedOrderCountsByListingId);
const mockSearchShopsQuery = vi.mocked(searchShopsQuery);
const mockGetPublishedRuleSet = vi.mocked(getPublishedRuleSet);
const mockGetShopPortfolio = vi.mocked(getShopPortfolio);
const mockGetGalleryWallSettings = vi.mocked(getGalleryWallSettings);
const mockListAvailableListingsForShop = vi.mocked(listAvailableListingsForShop);

const CANDIDATE = {
  listingId: "l1",
  title: "Watercolor Piece",
  priceCents: 1000,
  medium: "Watercolor",
  styleTags: ["pet portrait"],
  imageUrl: null,
  shopId: "shop-1",
  shopDisplayName: "Jane's Studio",
  shopSlotState: "open" as const,
  createdAt: new Date("2026-01-01T00:00:00Z"),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetCompletedOrderCountsByListingId.mockResolvedValue({});
  mockGetGalleryWallSettings.mockResolvedValue(undefined);
});

describe("browseFeed (SECURITY-05: safe defaults)", () => {
  it("returns paginated candidates matching the given filters", async () => {
    mockFindAvailableListingCandidates.mockResolvedValue([CANDIDATE]);

    const result = await browseFeed({ medium: "Watercolor", page: 1 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe("Watercolor Piece");
  });

  it("excludes candidates outside the price range", async () => {
    mockFindAvailableListingCandidates.mockResolvedValue([CANDIDATE]);

    const result = await browseFeed({ priceMinCents: 5000 });

    expect(result.items).toHaveLength(0);
  });

  it("falls back to defaults for malformed input rather than throwing", async () => {
    mockFindAvailableListingCandidates.mockResolvedValue([CANDIDATE]);
    await expect(browseFeed(null)).resolves.toBeDefined();
    await expect(browseFeed({ page: -1 })).rejects.toThrow();
  });
});

describe("browseFeed sort", () => {
  const OLDER_CHEAP = {
    ...CANDIDATE,
    listingId: "l-old-cheap",
    priceCents: 500,
    createdAt: new Date("2025-01-01T00:00:00Z"),
  };
  const NEWER_EXPENSIVE = {
    ...CANDIDATE,
    listingId: "l-new-expensive",
    priceCents: 9000,
    createdAt: new Date("2026-06-01T00:00:00Z"),
  };

  it("defaults to newest first", async () => {
    mockFindAvailableListingCandidates.mockResolvedValue([OLDER_CHEAP, NEWER_EXPENSIVE]);
    const result = await browseFeed({});
    expect(result.items.map((i) => i.listingId)).toEqual(["l-new-expensive", "l-old-cheap"]);
  });

  it("sorts by price ascending", async () => {
    mockFindAvailableListingCandidates.mockResolvedValue([NEWER_EXPENSIVE, OLDER_CHEAP]);
    const result = await browseFeed({ sort: "price-asc" });
    expect(result.items.map((i) => i.listingId)).toEqual(["l-old-cheap", "l-new-expensive"]);
  });

  it("sorts by price descending", async () => {
    mockFindAvailableListingCandidates.mockResolvedValue([OLDER_CHEAP, NEWER_EXPENSIVE]);
    const result = await browseFeed({ sort: "price-desc" });
    expect(result.items.map((i) => i.listingId)).toEqual(["l-new-expensive", "l-old-cheap"]);
  });

  it("sorts by popularity (completed order count) descending", async () => {
    mockFindAvailableListingCandidates.mockResolvedValue([OLDER_CHEAP, NEWER_EXPENSIVE]);
    mockGetCompletedOrderCountsByListingId.mockResolvedValue({ "l-old-cheap": 5 });

    const result = await browseFeed({ sort: "popular" });

    expect(result.items.map((i) => i.listingId)).toEqual(["l-old-cheap", "l-new-expensive"]);
    expect(result.items[0]).toMatchObject({ orderCount: 5 });
    expect(result.items[1]).toMatchObject({ orderCount: 0 });
  });
});

describe("browseFeed availableTags", () => {
  it("returns the distinct set of style tags across all available listings, regardless of active filters", async () => {
    mockFindAvailableListingCandidates.mockResolvedValue([
      { ...CANDIDATE, listingId: "l1", styleTags: ["Portrait", "Landscape"] },
      { ...CANDIDATE, listingId: "l2", styleTags: ["Landscape", "Sticker"] },
    ]);

    const result = await browseFeed({ styleTags: ["Sticker"] });

    expect(result.availableTags).toEqual(["Landscape", "Portrait", "Sticker"]);
    expect(result.items).toHaveLength(1); // still filtered per the active styleTags filter
  });
});

describe("searchShops (fail-safe default)", () => {
  it("returns paginated results for a valid query", async () => {
    mockSearchShopsQuery.mockResolvedValue([
      { shopId: "shop-1", displayName: "Jane's Studio", bio: "Hi", avatarImageUrl: null, rank: 1 },
    ]);

    const result = await searchShops({ query: "Jane" });

    expect(result.items).toEqual([
      { shopId: "shop-1", displayName: "Jane's Studio", bio: "Hi", avatarImageUrl: null },
    ]);
  });

  it("returns an empty result set for invalid input rather than throwing", async () => {
    const result = await searchShops({ query: "" });
    expect(result).toEqual({ items: [], page: 1, pageSize: 24, totalCount: 0 });
    expect(mockSearchShopsQuery).not.toHaveBeenCalled();
  });
});

describe("getShopPageData (BR-5: null, not thrown, for a nonexistent shop)", () => {
  it("returns null when the shop doesn't exist", async () => {
    mockFindShopProfileWithOwnerName.mockResolvedValue(undefined as never);
    const result = await getShopPageData("missing");
    expect(result).toBeNull();
    expect(mockGetShopPortfolio).not.toHaveBeenCalled();
  });

  it("assembles shop, portfolio, rules, and listings for an existing shop", async () => {
    mockFindShopProfileWithOwnerName.mockResolvedValue({
      id: "shop-1",
      userId: "user-1",
      displayName: "Jane's Studio",
      bio: null,
      bannerImageUrl: null,
      avatarImageUrl: null,
      socialLinks: [],
    });
    mockGetShopPortfolio.mockResolvedValue([]);
    mockGetPublishedRuleSet.mockResolvedValue(null);
    mockListAvailableListingsForShop.mockResolvedValue([]);
    mockGetGalleryWallSettings.mockResolvedValue(undefined);

    const result = await getShopPageData("shop-1");

    expect(result?.shop.displayName).toBe("Jane's Studio");
    expect(result?.portfolio).toEqual([]);
    expect(result?.publishedRules).toBeNull();
    expect(result?.availableListings).toEqual([]);
    expect(result?.galleryWallSettings).toBeUndefined();
  });
});

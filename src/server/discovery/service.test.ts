import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/discovery/repository", () => ({
  findAvailableListingCandidates: vi.fn(),
  findShopProfileWithOwnerName: vi.fn(),
  searchShopsQuery: vi.fn(),
}));
vi.mock("@/server/shops/service", () => ({
  getPublishedRuleSet: vi.fn(),
  getShopPortfolio: vi.fn(),
}));
vi.mock("@/server/listings/repository", () => ({
  listAvailableListingsForShop: vi.fn(),
}));

import {
  findAvailableListingCandidates,
  findShopProfileWithOwnerName,
  searchShopsQuery,
} from "@/server/discovery/repository";
import { getPublishedRuleSet, getShopPortfolio } from "@/server/shops/service";
import { listAvailableListingsForShop } from "@/server/listings/repository";
import { browseFeed, getShopPageData, searchShops } from "@/server/discovery/service";

const mockFindAvailableListingCandidates = vi.mocked(findAvailableListingCandidates);
const mockFindShopProfileWithOwnerName = vi.mocked(findShopProfileWithOwnerName);
const mockSearchShopsQuery = vi.mocked(searchShopsQuery);
const mockGetPublishedRuleSet = vi.mocked(getPublishedRuleSet);
const mockGetShopPortfolio = vi.mocked(getShopPortfolio);
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
};

beforeEach(() => {
  vi.clearAllMocks();
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
      displayName: "Jane's Studio",
      bio: null,
      bannerImageUrl: null,
      avatarImageUrl: null,
      socialLinks: [],
    });
    mockGetShopPortfolio.mockResolvedValue([]);
    mockGetPublishedRuleSet.mockResolvedValue(null);
    mockListAvailableListingsForShop.mockResolvedValue([]);

    const result = await getShopPageData("shop-1");

    expect(result?.shop.displayName).toBe("Jane's Studio");
    expect(result?.portfolio).toEqual([]);
    expect(result?.publishedRules).toBeNull();
    expect(result?.availableListings).toEqual([]);
  });
});

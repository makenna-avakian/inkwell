import { beforeEach, describe, expect, it, vi } from "vitest";
import fc from "fast-check";

vi.mock("@/server/listings/repository", () => ({
  findListingById: vi.fn(),
  findListingWithShopOwner: vi.fn(),
  createListingRow: vi.fn(),
  updateListingRow: vi.fn(),
  setListingStatusRow: vi.fn(),
  addListingImageRow: vi.fn(),
  listListingImages: vi.fn(),
}));

vi.mock("@/server/shops/storage", () => ({
  createPresignedUpload: vi.fn(),
  validateImageUpload: vi.fn(),
}));

import {
  createListingRow,
  findListingWithShopOwner,
  setListingStatusRow,
  updateListingRow,
} from "@/server/listings/repository";
import { validateImageUpload } from "@/server/shops/storage";
import {
  ListingValidationError,
  NotListingOwnerError,
  addListingImage,
  createListing,
  setListingStatus,
  updateListing,
} from "@/server/listings/service";

const mockCreateListingRow = vi.mocked(createListingRow);
const mockFindListingWithShopOwner = vi.mocked(findListingWithShopOwner);
const mockUpdateListingRow = vi.mocked(updateListingRow);
const mockSetListingStatusRow = vi.mocked(setListingStatusRow);
const mockValidateImageUpload = vi.mocked(validateImageUpload);

const LISTING = {
  id: "listing-1",
  shopId: "shop-1",
  title: "House by the Sea",
  description: null,
  priceCents: 5000,
  status: "available" as const,
  createdAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createListing (BR-1)", () => {
  it("creates a listing with a zero price (free to a good home)", async () => {
    mockCreateListingRow.mockResolvedValue({ ...LISTING, priceCents: 0 });
    await createListing("shop-1", { title: "Free sketch", priceCents: 0 });
    expect(mockCreateListingRow).toHaveBeenCalledWith(
      expect.objectContaining({ priceCents: 0 }),
    );
  });

  it("rejects a negative price", async () => {
    await expect(
      createListing("shop-1", { title: "Bad", priceCents: -100 }),
    ).rejects.toThrow(ListingValidationError);
  });
});

describe("createListing (PBT-01: price invariant)", () => {
  it("never accepts a negative price, for any generated input", async () => {
    await fc.assert(
      fc.asyncProperty(fc.integer({ max: -1 }), async (negativePrice) => {
        await expect(
          createListing("shop-1", { title: "x", priceCents: negativePrice }),
        ).rejects.toThrow(ListingValidationError);
      }),
    );
  });

  it("always accepts zero or any positive integer price", async () => {
    mockCreateListingRow.mockResolvedValue(LISTING);
    await fc.assert(
      fc.asyncProperty(fc.integer({ min: 0, max: 10_000_000 }), async (price) => {
        await expect(
          createListing("shop-1", { title: "x", priceCents: price }),
        ).resolves.toBeDefined();
      }),
    );
  });
});

describe("updateListing / setListingStatus (BR-2 object-level auth)", () => {
  it("rejects a non-owner", async () => {
    mockFindListingWithShopOwner.mockResolvedValue({
      listing: LISTING,
      shopUserId: "actual-owner",
    });
    await expect(
      updateListing("listing-1", "someone-else", { title: "New" }),
    ).rejects.toThrow(NotListingOwnerError);
    expect(mockUpdateListingRow).not.toHaveBeenCalled();
  });

  it("allows the owner to update", async () => {
    mockFindListingWithShopOwner.mockResolvedValue({
      listing: LISTING,
      shopUserId: "owner-1",
    });
    mockUpdateListingRow.mockResolvedValue({ ...LISTING, title: "New" });
    await updateListing("listing-1", "owner-1", { title: "New" });
    expect(mockUpdateListingRow).toHaveBeenCalled();
  });
});

describe("setListingStatus (BR-4: no rigid state machine)", () => {
  it("allows every transition among available/sold/removed", async () => {
    mockFindListingWithShopOwner.mockResolvedValue({
      listing: LISTING,
      shopUserId: "owner-1",
    });
    mockSetListingStatusRow.mockResolvedValue(LISTING);

    for (const status of ["available", "sold", "removed"] as const) {
      await expect(
        setListingStatus("listing-1", "owner-1", status),
      ).resolves.toBeDefined();
    }
  });
});

describe("addListingImage (BR-5: reuses Unit 2's validation)", () => {
  it("validates before requesting an upload URL", async () => {
    mockFindListingWithShopOwner.mockResolvedValue({
      listing: LISTING,
      shopUserId: "owner-1",
    });
    await addListingImage("listing-1", "owner-1", "a.png", "image/png", 1000);
    expect(mockValidateImageUpload).toHaveBeenCalledWith("image/png", 1000);
  });
});

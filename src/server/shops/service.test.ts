import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/shops/repository", () => ({
  findShopByUserId: vi.fn(),
  findShopById: vi.fn(),
  createShopProfile: vi.fn(),
  updateShopProfile: vi.fn(),
  addPortfolioImageRow: vi.fn(),
  listPortfolioImages: vi.fn(),
  findPortfolioImageById: vi.fn(),
  updatePortfolioImageRow: vi.fn(),
  deletePortfolioImageRow: vi.fn(),
  reorderPortfolioImagesRow: vi.fn(),
  setFeaturedPortfolioImageRow: vi.fn(),
  getExistingVersionNumbers: vi.fn(),
  insertRuleVersion: vi.fn(),
  getRuleVersionById: vi.fn(),
  getShopCommissionSettings: vi.fn(),
  setCurrentVersion: vi.fn(),
  setMaxQueueRow: vi.fn(),
  setSlotStateRow: vi.fn(),
}));

vi.mock("@/server/shops/storage", () => ({
  createPresignedUpload: vi.fn(),
  validateImageUpload: vi.fn(),
  verifyUploadedImageSize: vi.fn(),
  InvalidImageError: class InvalidImageError extends Error {},
}));

vi.mock("@/server/listings/repository", () => ({
  findListingById: vi.fn(),
}));

import {
  addPortfolioImageRow,
  createShopProfile,
  deletePortfolioImageRow,
  findPortfolioImageById,
  findShopById,
  findShopByUserId,
  getExistingVersionNumbers,
  getRuleVersionById,
  getShopCommissionSettings,
  insertRuleVersion,
  listPortfolioImages,
  reorderPortfolioImagesRow,
  setCurrentVersion,
  setFeaturedPortfolioImageRow,
  updatePortfolioImageRow,
  updateShopProfile,
} from "@/server/shops/repository";
import {
  createPresignedUpload,
  InvalidImageError,
  validateImageUpload,
  verifyUploadedImageSize,
} from "@/server/shops/storage";
import { findListingById } from "@/server/listings/repository";
import {
  NotPortfolioImageOwnerError,
  NotShopOwnerError,
  PortfolioImageValidationError,
  RuleSetValidationError,
  ShopAlreadyExistsError,
  confirmAvatarImage,
  confirmBannerImage,
  confirmPortfolioImage,
  createShop,
  deletePortfolioImage,
  getPublishedRuleSet,
  isSeller,
  publishRuleSet,
  requestAvatarUploadUrl,
  requestBannerUploadUrl,
  requestPortfolioUploadUrl,
  reorderPortfolioImages,
  setFeaturedPortfolioImage,
  setSlotState,
  updatePortfolioImage,
  updateShop,
} from "@/server/shops/service";

const mockFindShopByUserId = vi.mocked(findShopByUserId);
const mockFindShopById = vi.mocked(findShopById);
const mockCreateShopProfile = vi.mocked(createShopProfile);
const mockUpdateShopProfile = vi.mocked(updateShopProfile);
const mockAddPortfolioImageRow = vi.mocked(addPortfolioImageRow);
const mockListPortfolioImages = vi.mocked(listPortfolioImages);
const mockFindPortfolioImageById = vi.mocked(findPortfolioImageById);
const mockUpdatePortfolioImageRow = vi.mocked(updatePortfolioImageRow);
const mockDeletePortfolioImageRow = vi.mocked(deletePortfolioImageRow);
const mockReorderPortfolioImagesRow = vi.mocked(reorderPortfolioImagesRow);
const mockSetFeaturedPortfolioImageRow = vi.mocked(setFeaturedPortfolioImageRow);
const mockGetExistingVersionNumbers = vi.mocked(getExistingVersionNumbers);
const mockInsertRuleVersion = vi.mocked(insertRuleVersion);
const mockGetRuleVersionById = vi.mocked(getRuleVersionById);
const mockGetShopCommissionSettings = vi.mocked(getShopCommissionSettings);
const mockSetCurrentVersion = vi.mocked(setCurrentVersion);
const mockCreatePresignedUpload = vi.mocked(createPresignedUpload);
const mockValidateImageUpload = vi.mocked(validateImageUpload);
const mockVerifyUploadedImageSize = vi.mocked(verifyUploadedImageSize);
const mockFindListingById = vi.mocked(findListingById);

const PORTFOLIO_IMAGE = {
  id: "img-1",
  shopId: "shop-1",
  imageUrl: "https://media.inkwell.app/prod/x.png",
  position: 1,
  title: null,
  caption: null,
  tags: [],
  listingId: null,
  featured: false,
  createdAt: new Date(),
};

const SHOP = {
  id: "shop-1",
  userId: "user-1",
  shopName: null,
  bannerImageUrl: null,
  avatarImageUrl: null,
  bio: null,
  socialLinks: [],
  stripeConnectAccountId: null,
  createdAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("isSeller (BR-8)", () => {
  it("returns true when a shop exists for the user", async () => {
    mockFindShopByUserId.mockResolvedValue(SHOP);
    expect(await isSeller("user-1")).toBe(true);
  });

  it("returns false when no shop exists", async () => {
    mockFindShopByUserId.mockResolvedValue(undefined);
    expect(await isSeller("user-2")).toBe(false);
  });
});

describe("createShop", () => {
  it("creates a shop when the user has none yet", async () => {
    mockFindShopByUserId.mockResolvedValue(undefined);
    mockCreateShopProfile.mockResolvedValue(SHOP);

    await createShop("user-1", { socialLinks: [] });
    expect(mockCreateShopProfile).toHaveBeenCalled();
  });

  it("passes shopName through to the repository", async () => {
    mockFindShopByUserId.mockResolvedValue(undefined);
    mockCreateShopProfile.mockResolvedValue({ ...SHOP, shopName: "Jane's Studio" });

    await createShop("user-1", { shopName: "Jane's Studio", socialLinks: [] });
    expect(mockCreateShopProfile).toHaveBeenCalledWith(
      expect.objectContaining({ shopName: "Jane's Studio" }),
    );
  });

  it("rejects creating a second shop for the same user", async () => {
    mockFindShopByUserId.mockResolvedValue(SHOP);
    await expect(createShop("user-1", { socialLinks: [] })).rejects.toThrow(
      ShopAlreadyExistsError,
    );
  });
});

describe("updateShop", () => {
  it("rejects a non-owner", async () => {
    mockFindShopById.mockResolvedValue(SHOP);
    await expect(
      updateShop("shop-1", "someone-else", { shopName: "New Name" }),
    ).rejects.toThrow(NotShopOwnerError);
    expect(mockUpdateShopProfile).not.toHaveBeenCalled();
  });

  it("forwards shopName/bio/socialLinks to the repository for the owner", async () => {
    mockFindShopById.mockResolvedValue(SHOP);
    const socialLinks = [{ label: "Instagram", url: "https://instagram.com/janedoe" }];

    await updateShop("shop-1", "user-1", { shopName: "Jane's Studio", bio: "hi", socialLinks });

    expect(mockUpdateShopProfile).toHaveBeenCalledWith("shop-1", {
      shopName: "Jane's Studio",
      bio: "hi",
      socialLinks,
    });
  });
});

describe("requestBannerUploadUrl / confirmBannerImage", () => {
  it("rejects a non-owner", async () => {
    mockFindShopById.mockResolvedValue(SHOP);
    await expect(
      requestBannerUploadUrl("shop-1", "someone-else", "a.png", "image/png", 1000),
    ).rejects.toThrow(NotShopOwnerError);
  });

  it("confirms the banner image only for the owner", async () => {
    mockFindShopById.mockResolvedValue(SHOP);
    mockUpdateShopProfile.mockResolvedValue({ ...SHOP, bannerImageUrl: "https://media/x.png" });

    await confirmBannerImage("shop-1", "user-1", "https://media/x.png");
    expect(mockVerifyUploadedImageSize).toHaveBeenCalledWith("https://media/x.png");
    expect(mockUpdateShopProfile).toHaveBeenCalledWith("shop-1", {
      bannerImageUrl: "https://media/x.png",
    });
  });

  it("rejects an oversized upload caught by the post-upload size check (BR-7)", async () => {
    mockFindShopById.mockResolvedValue(SHOP);
    mockVerifyUploadedImageSize.mockRejectedValueOnce(new InvalidImageError("Image must be under 5MB."));

    await expect(confirmBannerImage("shop-1", "user-1", "https://media/x.png")).rejects.toThrow(
      InvalidImageError,
    );
    expect(mockUpdateShopProfile).not.toHaveBeenCalled();
  });
});

describe("requestAvatarUploadUrl / confirmAvatarImage", () => {
  it("rejects a non-owner", async () => {
    mockFindShopById.mockResolvedValue(SHOP);
    await expect(
      requestAvatarUploadUrl("shop-1", "someone-else", "a.png", "image/png", 1000),
    ).rejects.toThrow(NotShopOwnerError);
  });

  it("confirms the avatar image only for the owner", async () => {
    mockFindShopById.mockResolvedValue(SHOP);
    mockUpdateShopProfile.mockResolvedValue({ ...SHOP, avatarImageUrl: "https://media/y.png" });

    await confirmAvatarImage("shop-1", "user-1", "https://media/y.png");
    expect(mockVerifyUploadedImageSize).toHaveBeenCalledWith("https://media/y.png");
    expect(mockUpdateShopProfile).toHaveBeenCalledWith("shop-1", {
      avatarImageUrl: "https://media/y.png",
    });
  });
});

describe("requestPortfolioUploadUrl / confirmPortfolioImage (BR-2, BR-7)", () => {
  it("rejects a non-owner", async () => {
    mockFindShopById.mockResolvedValue(SHOP);
    await expect(
      requestPortfolioUploadUrl("shop-1", "someone-else", "a.png", "image/png", 1000),
    ).rejects.toThrow(NotShopOwnerError);
    expect(mockValidateImageUpload).not.toHaveBeenCalled();
  });

  it("validates the image before generating a presigned URL", async () => {
    mockFindShopById.mockResolvedValue(SHOP);
    mockCreatePresignedUpload.mockResolvedValue({
      uploadUrl: "https://r2/upload",
      imageUrl: "https://media.inkwell.app/prod/shops/shop-1/x.png",
      objectKey: "prod/shops/shop-1/x.png",
    });

    await requestPortfolioUploadUrl("shop-1", "user-1", "a.png", "image/png", 1000);
    expect(mockValidateImageUpload).toHaveBeenCalledWith("image/png", 1000);
  });

  it("confirms a portfolio image only for the owner, with no metadata", async () => {
    mockFindShopById.mockResolvedValue(SHOP);
    mockAddPortfolioImageRow.mockResolvedValue(PORTFOLIO_IMAGE);

    await confirmPortfolioImage("shop-1", "user-1", "https://media.inkwell.app/prod/x.png");
    expect(mockVerifyUploadedImageSize).toHaveBeenCalledWith("https://media.inkwell.app/prod/x.png");
    expect(mockAddPortfolioImageRow).toHaveBeenCalledWith(
      "shop-1",
      "https://media.inkwell.app/prod/x.png",
      { title: null, caption: null, tags: [], listingId: null },
    );
  });

  it("rejects an oversized upload caught by the post-upload size check (BR-7)", async () => {
    mockFindShopById.mockResolvedValue(SHOP);
    mockVerifyUploadedImageSize.mockRejectedValueOnce(new InvalidImageError("Image must be under 5MB."));

    await expect(
      confirmPortfolioImage("shop-1", "user-1", "https://media.inkwell.app/prod/x.png"),
    ).rejects.toThrow(InvalidImageError);
    expect(mockAddPortfolioImageRow).not.toHaveBeenCalled();
  });

  it("passes title/caption/tags through when provided", async () => {
    mockFindShopById.mockResolvedValue(SHOP);
    mockAddPortfolioImageRow.mockResolvedValue(PORTFOLIO_IMAGE);

    await confirmPortfolioImage("shop-1", "user-1", "https://media.inkwell.app/prod/x.png", {
      title: "Autumn Study",
      caption: "Gouache on paper",
      tags: ["watercolor", "landscape"],
    });

    expect(mockAddPortfolioImageRow).toHaveBeenCalledWith(
      "shop-1",
      "https://media.inkwell.app/prod/x.png",
      { title: "Autumn Study", caption: "Gouache on paper", tags: ["watercolor", "landscape"], listingId: null },
    );
  });

  it("rejects a listingId that doesn't belong to this shop", async () => {
    mockFindShopById.mockResolvedValue(SHOP);
    mockFindListingById.mockResolvedValue({
      id: "listing-1",
      shopId: "some-other-shop",
      title: "Piece",
      description: null,
      priceCents: 1000,
      status: "available",
      medium: null,
      styleTags: [],
      createdAt: new Date(),
    });

    await expect(
      confirmPortfolioImage("shop-1", "user-1", "https://media/x.png", { listingId: "listing-1" }),
    ).rejects.toThrow(PortfolioImageValidationError);
    expect(mockAddPortfolioImageRow).not.toHaveBeenCalled();
  });

  it("rejects invalid metadata (e.g. too many tags)", async () => {
    mockFindShopById.mockResolvedValue(SHOP);

    await expect(
      confirmPortfolioImage("shop-1", "user-1", "https://media/x.png", {
        tags: Array.from({ length: 21 }, (_, i) => `tag-${i}`),
      }),
    ).rejects.toThrow(PortfolioImageValidationError);
  });
});

describe("updatePortfolioImage", () => {
  it("rejects an image belonging to another shop", async () => {
    mockFindShopById.mockResolvedValue(SHOP);
    mockFindPortfolioImageById.mockResolvedValue({ ...PORTFOLIO_IMAGE, shopId: "other-shop" });

    await expect(
      updatePortfolioImage("shop-1", "user-1", "img-1", { title: "New title" }),
    ).rejects.toThrow(NotPortfolioImageOwnerError);
    expect(mockUpdatePortfolioImageRow).not.toHaveBeenCalled();
  });

  it("updates title/caption/tags/listingId for the owner", async () => {
    mockFindShopById.mockResolvedValue(SHOP);
    mockFindPortfolioImageById.mockResolvedValue(PORTFOLIO_IMAGE);
    mockUpdatePortfolioImageRow.mockResolvedValue({ ...PORTFOLIO_IMAGE, title: "Updated" });

    await updatePortfolioImage("shop-1", "user-1", "img-1", { title: "Updated" });
    expect(mockUpdatePortfolioImageRow).toHaveBeenCalledWith("img-1", "shop-1", {
      title: "Updated",
      caption: null,
      tags: [],
      listingId: null,
    });
  });
});

describe("deletePortfolioImage", () => {
  it("rejects an image belonging to another shop", async () => {
    mockFindShopById.mockResolvedValue(SHOP);
    mockFindPortfolioImageById.mockResolvedValue({ ...PORTFOLIO_IMAGE, shopId: "other-shop" });

    await expect(deletePortfolioImage("shop-1", "user-1", "img-1")).rejects.toThrow(
      NotPortfolioImageOwnerError,
    );
    expect(mockDeletePortfolioImageRow).not.toHaveBeenCalled();
  });

  it("deletes for the owner", async () => {
    mockFindShopById.mockResolvedValue(SHOP);
    mockFindPortfolioImageById.mockResolvedValue(PORTFOLIO_IMAGE);

    await deletePortfolioImage("shop-1", "user-1", "img-1");
    expect(mockDeletePortfolioImageRow).toHaveBeenCalledWith("img-1", "shop-1");
  });
});

describe("reorderPortfolioImages", () => {
  it("rejects a non-owner", async () => {
    mockFindShopById.mockResolvedValue(SHOP);
    await expect(
      reorderPortfolioImages("shop-1", "someone-else", ["img-1"]),
    ).rejects.toThrow(NotShopOwnerError);
  });

  it("rejects an order that doesn't match this shop's actual image ids", async () => {
    mockFindShopById.mockResolvedValue(SHOP);
    mockListPortfolioImages.mockResolvedValue([PORTFOLIO_IMAGE]);

    await expect(
      reorderPortfolioImages("shop-1", "user-1", ["img-1", "img-from-another-shop"]),
    ).rejects.toThrow(PortfolioImageValidationError);
    expect(mockReorderPortfolioImagesRow).not.toHaveBeenCalled();
  });

  it("applies the reorder when the ids exactly match", async () => {
    mockFindShopById.mockResolvedValue(SHOP);
    const second = { ...PORTFOLIO_IMAGE, id: "img-2" };
    mockListPortfolioImages.mockResolvedValue([PORTFOLIO_IMAGE, second]);

    await reorderPortfolioImages("shop-1", "user-1", ["img-2", "img-1"]);
    expect(mockReorderPortfolioImagesRow).toHaveBeenCalledWith("shop-1", ["img-2", "img-1"]);
  });
});

describe("setFeaturedPortfolioImage", () => {
  it("rejects an image belonging to another shop", async () => {
    mockFindShopById.mockResolvedValue(SHOP);
    mockFindPortfolioImageById.mockResolvedValue({ ...PORTFOLIO_IMAGE, shopId: "other-shop" });

    await expect(setFeaturedPortfolioImage("shop-1", "user-1", "img-1")).rejects.toThrow(
      NotPortfolioImageOwnerError,
    );
    expect(mockSetFeaturedPortfolioImageRow).not.toHaveBeenCalled();
  });

  it("sets the featured piece for the owner", async () => {
    mockFindShopById.mockResolvedValue(SHOP);
    mockFindPortfolioImageById.mockResolvedValue(PORTFOLIO_IMAGE);

    await setFeaturedPortfolioImage("shop-1", "user-1", "img-1");
    expect(mockSetFeaturedPortfolioImageRow).toHaveBeenCalledWith("shop-1", "img-1");
  });
});

describe("publishRuleSet (BR-3, BR-4)", () => {
  const validInput = {
    tiers: [{ id: "t1", name: "Sketch", description: "", priceCents: 5000 }],
    addOns: [],
    rulesContent: [{ type: "paragraph" as const, text: "Rules" }],
    maxQueue: 5,
  };

  it("rejects publishing with zero tiers", async () => {
    mockFindShopById.mockResolvedValue(SHOP);
    await expect(
      publishRuleSet("shop-1", "user-1", { ...validInput, tiers: [] }),
    ).rejects.toThrow(RuleSetValidationError);
  });

  it("computes the next version from existing versions and stores it", async () => {
    mockFindShopById.mockResolvedValue(SHOP);
    mockGetExistingVersionNumbers.mockResolvedValue([1, 2]);
    mockInsertRuleVersion.mockResolvedValue({
      id: "v3",
      shopId: "shop-1",
      version: 3,
      tiers: validInput.tiers,
      addOns: [],
      rulesContent: validInput.rulesContent,
      publishedAt: new Date(),
    });

    const result = await publishRuleSet("shop-1", "user-1", validInput);

    expect(mockInsertRuleVersion).toHaveBeenCalledWith(
      expect.objectContaining({ version: 3 }),
    );
    expect(mockSetCurrentVersion).toHaveBeenCalledWith("shop-1", "v3");
    expect(result.version).toBe(3);
  });

  it("rejects publishing from a non-owner", async () => {
    mockFindShopById.mockResolvedValue(SHOP);
    await expect(
      publishRuleSet("shop-1", "not-the-owner", validInput),
    ).rejects.toThrow(NotShopOwnerError);
  });
});

describe("setSlotState (BR-6)", () => {
  it("allows any state transition", async () => {
    mockFindShopById.mockResolvedValue(SHOP);
    await setSlotState("shop-1", "user-1", "waitlist");
    await setSlotState("shop-1", "user-1", "open");
    await setSlotState("shop-1", "user-1", "closed");
    // No error thrown for any transition — BR-6.
  });
});

describe("getPublishedRuleSet (read path)", () => {
  it("returns null when the shop has never published", async () => {
    mockGetShopCommissionSettings.mockResolvedValue({
      shopId: "shop-1",
      currentVersionId: null,
      slotState: "closed",
      maxQueue: null,
      updatedAt: new Date(),
    });
    expect(await getPublishedRuleSet("shop-1")).toBeNull();
    expect(mockGetRuleVersionById).not.toHaveBeenCalled();
  });

  it("returns the current version plus operational settings when published", async () => {
    mockGetShopCommissionSettings.mockResolvedValue({
      shopId: "shop-1",
      currentVersionId: "v1",
      slotState: "open",
      maxQueue: 3,
      updatedAt: new Date(),
    });
    mockGetRuleVersionById.mockResolvedValue({
      id: "v1",
      shopId: "shop-1",
      version: 1,
      tiers: [],
      addOns: [],
      rulesContent: [],
      publishedAt: new Date(),
    });

    const result = await getPublishedRuleSet("shop-1");
    expect(result?.slotState).toBe("open");
    expect(result?.maxQueue).toBe(3);
  });
});

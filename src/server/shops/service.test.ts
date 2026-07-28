import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/shops/repository", () => ({
  findShopByUserId: vi.fn(),
  findShopById: vi.fn(),
  createShopProfile: vi.fn(),
  updateShopProfile: vi.fn(),
  addPortfolioImageRow: vi.fn(),
  listPortfolioImages: vi.fn(),
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
}));

import {
  addPortfolioImageRow,
  createShopProfile,
  findShopById,
  findShopByUserId,
  getExistingVersionNumbers,
  getRuleVersionById,
  getShopCommissionSettings,
  insertRuleVersion,
  setCurrentVersion,
  updateShopProfile,
} from "@/server/shops/repository";
import { createPresignedUpload, validateImageUpload } from "@/server/shops/storage";
import {
  NotShopOwnerError,
  RuleSetValidationError,
  ShopAlreadyExistsError,
  confirmAvatarImage,
  confirmBannerImage,
  confirmPortfolioImage,
  createShop,
  getPublishedRuleSet,
  isSeller,
  publishRuleSet,
  requestAvatarUploadUrl,
  requestBannerUploadUrl,
  requestPortfolioUploadUrl,
  setSlotState,
  updateShop,
} from "@/server/shops/service";

const mockFindShopByUserId = vi.mocked(findShopByUserId);
const mockFindShopById = vi.mocked(findShopById);
const mockCreateShopProfile = vi.mocked(createShopProfile);
const mockUpdateShopProfile = vi.mocked(updateShopProfile);
const mockAddPortfolioImageRow = vi.mocked(addPortfolioImageRow);
const mockGetExistingVersionNumbers = vi.mocked(getExistingVersionNumbers);
const mockInsertRuleVersion = vi.mocked(insertRuleVersion);
const mockGetRuleVersionById = vi.mocked(getRuleVersionById);
const mockGetShopCommissionSettings = vi.mocked(getShopCommissionSettings);
const mockSetCurrentVersion = vi.mocked(setCurrentVersion);
const mockCreatePresignedUpload = vi.mocked(createPresignedUpload);
const mockValidateImageUpload = vi.mocked(validateImageUpload);

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
    expect(mockUpdateShopProfile).toHaveBeenCalledWith("shop-1", {
      bannerImageUrl: "https://media/x.png",
    });
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

  it("confirms a portfolio image only for the owner", async () => {
    mockFindShopById.mockResolvedValue(SHOP);
    mockAddPortfolioImageRow.mockResolvedValue({
      id: "img-1",
      shopId: "shop-1",
      imageUrl: "https://media.inkwell.app/prod/x.png",
      position: 1,
      createdAt: new Date(),
    });

    await confirmPortfolioImage("shop-1", "user-1", "https://media.inkwell.app/prod/x.png");
    expect(mockAddPortfolioImageRow).toHaveBeenCalledWith(
      "shop-1",
      "https://media.inkwell.app/prod/x.png",
    );
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

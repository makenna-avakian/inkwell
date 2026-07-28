import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth/config", () => ({ auth: vi.fn() }));
vi.mock("@/server/shops/service", () => ({
  createShop: vi.fn(),
  updateShop: vi.fn(),
  requestPortfolioUploadUrl: vi.fn(),
  confirmPortfolioImage: vi.fn(),
  requestBannerUploadUrl: vi.fn(),
  confirmBannerImage: vi.fn(),
  requestAvatarUploadUrl: vi.fn(),
  confirmAvatarImage: vi.fn(),
  ShopAlreadyExistsError: class ShopAlreadyExistsError extends Error {
    constructor() {
      super("You already have a shop.");
    }
  },
  NotShopOwnerError: class NotShopOwnerError extends Error {
    constructor() {
      super("You do not have permission to modify this shop.");
    }
  },
}));
vi.mock("@/server/shops/storage", () => ({
  InvalidImageError: class InvalidImageError extends Error {},
}));

import { auth } from "@/server/auth/config";
import {
  NotShopOwnerError,
  ShopAlreadyExistsError,
  confirmAvatarImage,
  confirmBannerImage,
  confirmPortfolioImage,
  createShop,
  requestAvatarUploadUrl,
  requestBannerUploadUrl,
  requestPortfolioUploadUrl,
  updateShop,
} from "@/server/shops/service";
import { InvalidImageError } from "@/server/shops/storage";
import {
  confirmAvatarImageAction,
  confirmBannerImageAction,
  confirmPortfolioImageAction,
  createShopAction,
  requestAvatarUploadUrlAction,
  requestBannerUploadUrlAction,
  requestPortfolioUploadUrlAction,
  updateShopAction,
} from "./actions";

const mockAuth = vi.mocked(auth);
const mockCreateShop = vi.mocked(createShop);
const mockUpdateShop = vi.mocked(updateShop);
const mockRequestUpload = vi.mocked(requestPortfolioUploadUrl);
const mockConfirmImage = vi.mocked(confirmPortfolioImage);
const mockRequestBannerUpload = vi.mocked(requestBannerUploadUrl);
const mockConfirmBanner = vi.mocked(confirmBannerImage);
const mockRequestAvatarUpload = vi.mocked(requestAvatarUploadUrl);
const mockConfirmAvatar = vi.mocked(confirmAvatarImage);

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
});

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("createShopAction", () => {
  it("creates a shop for the signed-in user", async () => {
    const result = await createShopAction({ fieldErrors: {} }, formData({ bio: "Hi" }));
    expect(mockCreateShop).toHaveBeenCalledWith("user-1", {
      shopName: undefined,
      bio: "Hi",
      socialLinks: [],
    });
    expect(result.formError).toBeUndefined();
  });

  it("passes shopName and parses socialLinks JSON", async () => {
    const socialLinks = [{ label: "Instagram", url: "https://instagram.com/janedoe" }];
    await createShopAction(
      { fieldErrors: {} },
      formData({ shopName: "Jane's Studio", bio: "Hi", socialLinks: JSON.stringify(socialLinks) }),
    );
    expect(mockCreateShop).toHaveBeenCalledWith("user-1", {
      shopName: "Jane's Studio",
      bio: "Hi",
      socialLinks,
    });
  });

  it("falls back to an empty list for malformed socialLinks JSON", async () => {
    await createShopAction({ fieldErrors: {} }, formData({ socialLinks: "not json" }));
    expect(mockCreateShop).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ socialLinks: [] }),
    );
  });

  it("surfaces a friendly error when a shop already exists", async () => {
    mockCreateShop.mockRejectedValue(new ShopAlreadyExistsError());
    const result = await createShopAction({ fieldErrors: {} }, formData({}));
    expect(result.formError).toBe("You already have a shop.");
  });

  it("falls back to a generic message for an unexpected error", async () => {
    mockCreateShop.mockRejectedValue(new Error("boom"));
    const result = await createShopAction({ fieldErrors: {} }, formData({}));
    expect(result.formError).toBe("Something went wrong. Please try again.");
  });
});

describe("updateShopAction", () => {
  it("forwards shopName/bio/socialLinks for the signed-in owner", async () => {
    const socialLinks = [{ label: "Site", url: "https://jane.example.com" }];
    const result = await updateShopAction(
      "shop-1",
      { fieldErrors: {} },
      formData({ shopName: "Jane's Studio", bio: "Hi", socialLinks: JSON.stringify(socialLinks) }),
    );
    expect(mockUpdateShop).toHaveBeenCalledWith("shop-1", "user-1", {
      shopName: "Jane's Studio",
      bio: "Hi",
      socialLinks,
    });
    expect(result.fieldErrors).toEqual({});
  });

  it("surfaces a friendly error for a non-owner", async () => {
    mockUpdateShop.mockRejectedValue(new NotShopOwnerError());
    const result = await updateShopAction("shop-1", { fieldErrors: {} }, formData({}));
    expect(result.formError).toBe("You do not have permission to modify this shop.");
  });

  it("falls back to a generic message for an unexpected error", async () => {
    mockUpdateShop.mockRejectedValue(new Error("boom"));
    const result = await updateShopAction("shop-1", { fieldErrors: {} }, formData({}));
    expect(result.formError).toBe("Something went wrong. Please try again.");
  });

  it("returns field errors when shopName/bio fail validation", async () => {
    const result = await updateShopAction(
      "shop-1",
      { fieldErrors: {} },
      formData({ shopName: "x".repeat(81) }),
    );
    expect(result.fieldErrors.shopName).toBeTruthy();
    expect(mockUpdateShop).not.toHaveBeenCalled();
  });
});

describe("requestPortfolioUploadUrlAction", () => {
  it("returns upload/image URLs on success", async () => {
    mockRequestUpload.mockResolvedValue({
      uploadUrl: "https://r2/upload",
      imageUrl: "https://media.inkwell.app/prod/x.png",
      objectKey: "prod/x.png",
    });
    const result = await requestPortfolioUploadUrlAction(
      "shop-1",
      "a.png",
      "image/png",
      1000,
    );
    expect(result.uploadUrl).toBe("https://r2/upload");
  });

  it("returns an error message for a non-owner", async () => {
    mockRequestUpload.mockRejectedValue(new NotShopOwnerError());
    const result = await requestPortfolioUploadUrlAction(
      "shop-1",
      "a.png",
      "image/png",
      1000,
    );
    expect(result.error).toBeTruthy();
    expect(result.uploadUrl).toBeUndefined();
  });

  it("returns an error message for an invalid image", async () => {
    mockRequestUpload.mockRejectedValue(new InvalidImageError("Unsupported file type."));
    const result = await requestPortfolioUploadUrlAction("shop-1", "a.gif", "image/gif", 1000);
    expect(result.error).toBe("Unsupported file type.");
  });

  it("falls back to a generic message for an unexpected error", async () => {
    mockRequestUpload.mockRejectedValue(new Error("boom"));
    const result = await requestPortfolioUploadUrlAction("shop-1", "a.png", "image/png", 1000);
    expect(result.error).toBe("Couldn't start upload. Please try again.");
  });
});

describe("confirmPortfolioImageAction", () => {
  it("confirms the image", async () => {
    const result = await confirmPortfolioImageAction("shop-1", "https://x/y.png");
    expect(mockConfirmImage).toHaveBeenCalledWith("shop-1", "user-1", "https://x/y.png");
    expect(result.error).toBeUndefined();
  });

  it("returns an error message for a non-owner", async () => {
    mockConfirmImage.mockRejectedValue(new NotShopOwnerError());
    const result = await confirmPortfolioImageAction("shop-1", "https://x/y.png");
    expect(result.error).toBe("You do not have permission to modify this shop.");
  });

  it("falls back to a generic message for an unexpected error", async () => {
    mockConfirmImage.mockRejectedValue(new Error("boom"));
    const result = await confirmPortfolioImageAction("shop-1", "https://x/y.png");
    expect(result.error).toBe("Couldn't save the image. Please try again.");
  });
});

describe("requestBannerUploadUrlAction / confirmBannerImageAction", () => {
  it("returns upload/image URLs on success", async () => {
    mockRequestBannerUpload.mockResolvedValue({
      uploadUrl: "https://r2/upload",
      imageUrl: "https://media.inkwell.app/prod/banner.png",
      objectKey: "prod/banner.png",
    });
    const result = await requestBannerUploadUrlAction("shop-1", "banner.png", "image/png", 1000);
    expect(result.uploadUrl).toBe("https://r2/upload");
  });

  it("confirms the banner image for the signed-in caller", async () => {
    const result = await confirmBannerImageAction("shop-1", "https://x/banner.png");
    expect(mockConfirmBanner).toHaveBeenCalledWith("shop-1", "user-1", "https://x/banner.png");
    expect(result.error).toBeUndefined();
  });

  it("returns an error message for an invalid banner image", async () => {
    mockRequestBannerUpload.mockRejectedValue(new InvalidImageError("Unsupported file type."));
    const result = await requestBannerUploadUrlAction("shop-1", "banner.gif", "image/gif", 1000);
    expect(result.error).toBe("Unsupported file type.");
  });

  it("falls back to a generic message for an unexpected banner upload error", async () => {
    mockRequestBannerUpload.mockRejectedValue(new Error("boom"));
    const result = await requestBannerUploadUrlAction("shop-1", "banner.png", "image/png", 1000);
    expect(result.error).toBe("Couldn't start upload. Please try again.");
  });

  it("returns an error message when confirming a banner as a non-owner", async () => {
    mockConfirmBanner.mockRejectedValue(new NotShopOwnerError());
    const result = await confirmBannerImageAction("shop-1", "https://x/banner.png");
    expect(result.error).toBe("You do not have permission to modify this shop.");
  });

  it("falls back to a generic message for an unexpected confirm-banner error", async () => {
    mockConfirmBanner.mockRejectedValue(new Error("boom"));
    const result = await confirmBannerImageAction("shop-1", "https://x/banner.png");
    expect(result.error).toBe("Couldn't save the image. Please try again.");
  });
});

describe("requestAvatarUploadUrlAction / confirmAvatarImageAction", () => {
  it("returns upload/image URLs on success", async () => {
    mockRequestAvatarUpload.mockResolvedValue({
      uploadUrl: "https://r2/upload",
      imageUrl: "https://media.inkwell.app/prod/avatar.png",
      objectKey: "prod/avatar.png",
    });
    const result = await requestAvatarUploadUrlAction("shop-1", "avatar.png", "image/png", 1000);
    expect(result.uploadUrl).toBe("https://r2/upload");
  });

  it("confirms the avatar image for the signed-in caller", async () => {
    const result = await confirmAvatarImageAction("shop-1", "https://x/avatar.png");
    expect(mockConfirmAvatar).toHaveBeenCalledWith("shop-1", "user-1", "https://x/avatar.png");
    expect(result.error).toBeUndefined();
  });

  it("returns an error message for an invalid avatar image", async () => {
    mockRequestAvatarUpload.mockRejectedValue(new InvalidImageError("Unsupported file type."));
    const result = await requestAvatarUploadUrlAction("shop-1", "avatar.gif", "image/gif", 1000);
    expect(result.error).toBe("Unsupported file type.");
  });

  it("falls back to a generic message for an unexpected avatar upload error", async () => {
    mockRequestAvatarUpload.mockRejectedValue(new Error("boom"));
    const result = await requestAvatarUploadUrlAction("shop-1", "avatar.png", "image/png", 1000);
    expect(result.error).toBe("Couldn't start upload. Please try again.");
  });

  it("returns an error message when confirming an avatar as a non-owner", async () => {
    mockConfirmAvatar.mockRejectedValue(new NotShopOwnerError());
    const result = await confirmAvatarImageAction("shop-1", "https://x/avatar.png");
    expect(result.error).toBe("You do not have permission to modify this shop.");
  });

  it("falls back to a generic message for an unexpected confirm-avatar error", async () => {
    mockConfirmAvatar.mockRejectedValue(new Error("boom"));
    const result = await confirmAvatarImageAction("shop-1", "https://x/avatar.png");
    expect(result.error).toBe("Couldn't save the image. Please try again.");
  });
});

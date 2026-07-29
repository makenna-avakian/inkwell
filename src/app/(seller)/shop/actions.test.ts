import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth/config", () => ({ auth: vi.fn() }));
vi.mock("@/server/shops/service", () => ({
  createShop: vi.fn(),
  updateShop: vi.fn(),
  requestPortfolioUploadUrl: vi.fn(),
  confirmPortfolioImage: vi.fn(),
  updatePortfolioImage: vi.fn(),
  deletePortfolioImage: vi.fn(),
  reorderPortfolioImages: vi.fn(),
  setFeaturedPortfolioImage: vi.fn(),
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
  NotPortfolioImageOwnerError: class NotPortfolioImageOwnerError extends Error {
    constructor() {
      super("You do not have permission to modify this portfolio piece.");
    }
  },
  PortfolioImageValidationError: class PortfolioImageValidationError extends Error {},
}));
vi.mock("@/server/shops/storage", () => ({
  InvalidImageError: class InvalidImageError extends Error {},
}));

import { auth } from "@/server/auth/config";
import {
  NotPortfolioImageOwnerError,
  NotShopOwnerError,
  PortfolioImageValidationError,
  ShopAlreadyExistsError,
  confirmAvatarImage,
  confirmBannerImage,
  confirmPortfolioImage,
  createShop,
  deletePortfolioImage,
  requestAvatarUploadUrl,
  requestBannerUploadUrl,
  requestPortfolioUploadUrl,
  reorderPortfolioImages,
  setFeaturedPortfolioImage,
  updatePortfolioImage,
  updateShop,
} from "@/server/shops/service";
import { InvalidImageError } from "@/server/shops/storage";
import {
  confirmAvatarImageAction,
  confirmBannerImageAction,
  confirmPortfolioImageAction,
  createShopAction,
  deletePortfolioImageAction,
  requestAvatarUploadUrlAction,
  requestBannerUploadUrlAction,
  requestPortfolioUploadUrlAction,
  reorderPortfolioImagesAction,
  setFeaturedPortfolioImageAction,
  updatePortfolioImageAction,
  updateShopAction,
} from "./actions";

const mockAuth = vi.mocked(auth);
const mockCreateShop = vi.mocked(createShop);
const mockUpdateShop = vi.mocked(updateShop);
const mockRequestUpload = vi.mocked(requestPortfolioUploadUrl);
const mockConfirmImage = vi.mocked(confirmPortfolioImage);
const mockUpdatePortfolioImage = vi.mocked(updatePortfolioImage);
const mockDeletePortfolioImage = vi.mocked(deletePortfolioImage);
const mockReorderPortfolioImages = vi.mocked(reorderPortfolioImages);
const mockSetFeaturedPortfolioImage = vi.mocked(setFeaturedPortfolioImage);
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
      uploadFields: { key: "prod/x.png" },
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
  it("confirms the image, forwarding metadata, and returns the new image's id", async () => {
    mockConfirmImage.mockResolvedValue({
      id: "img-1",
      shopId: "shop-1",
      imageUrl: "https://x/y.png",
      position: 1,
      title: "Piece",
      caption: "hi",
      tags: ["ink"],
      listingId: null,
      featured: false,
      createdAt: new Date(),
    });
    const metadata = { title: "Piece", caption: "hi", tags: ["ink"] };
    const result = await confirmPortfolioImageAction("shop-1", "https://x/y.png", metadata);
    expect(mockConfirmImage).toHaveBeenCalledWith("shop-1", "user-1", "https://x/y.png", metadata);
    expect(result.id).toBe("img-1");
    expect(result.error).toBeUndefined();
  });

  it("returns an error message for a non-owner", async () => {
    mockConfirmImage.mockRejectedValue(new NotShopOwnerError());
    const result = await confirmPortfolioImageAction("shop-1", "https://x/y.png");
    expect(result.error).toBe("You do not have permission to modify this shop.");
  });

  it("returns an error message for invalid metadata", async () => {
    mockConfirmImage.mockRejectedValue(new PortfolioImageValidationError("Too many tags."));
    const result = await confirmPortfolioImageAction("shop-1", "https://x/y.png");
    expect(result.error).toBe("Too many tags.");
  });

  it("falls back to a generic message for an unexpected error", async () => {
    mockConfirmImage.mockRejectedValue(new Error("boom"));
    const result = await confirmPortfolioImageAction("shop-1", "https://x/y.png");
    expect(result.error).toBe("Couldn't save the image. Please try again.");
  });
});

describe("updatePortfolioImageAction", () => {
  it("updates the image for the signed-in caller", async () => {
    const result = await updatePortfolioImageAction("shop-1", "img-1", { title: "New title" });
    expect(mockUpdatePortfolioImage).toHaveBeenCalledWith("shop-1", "user-1", "img-1", {
      title: "New title",
    });
    expect(result.error).toBeUndefined();
  });

  it("returns an error message for a non-owner", async () => {
    mockUpdatePortfolioImage.mockRejectedValue(new NotPortfolioImageOwnerError());
    const result = await updatePortfolioImageAction("shop-1", "img-1", {});
    expect(result.error).toBe("You do not have permission to modify this portfolio piece.");
  });

  it("falls back to a generic message for an unexpected error", async () => {
    mockUpdatePortfolioImage.mockRejectedValue(new Error("boom"));
    const result = await updatePortfolioImageAction("shop-1", "img-1", {});
    expect(result.error).toBe("Couldn't save the changes. Please try again.");
  });
});

describe("deletePortfolioImageAction", () => {
  it("deletes the image for the signed-in caller", async () => {
    const result = await deletePortfolioImageAction("shop-1", "img-1");
    expect(mockDeletePortfolioImage).toHaveBeenCalledWith("shop-1", "user-1", "img-1");
    expect(result.error).toBeUndefined();
  });

  it("returns an error message for a non-owner", async () => {
    mockDeletePortfolioImage.mockRejectedValue(new NotPortfolioImageOwnerError());
    const result = await deletePortfolioImageAction("shop-1", "img-1");
    expect(result.error).toBe("You do not have permission to modify this portfolio piece.");
  });

  it("falls back to a generic message for an unexpected error", async () => {
    mockDeletePortfolioImage.mockRejectedValue(new Error("boom"));
    const result = await deletePortfolioImageAction("shop-1", "img-1");
    expect(result.error).toBe("Couldn't delete the piece. Please try again.");
  });
});

describe("reorderPortfolioImagesAction", () => {
  it("reorders for the signed-in caller", async () => {
    const result = await reorderPortfolioImagesAction("shop-1", ["img-2", "img-1"]);
    expect(mockReorderPortfolioImages).toHaveBeenCalledWith("shop-1", "user-1", ["img-2", "img-1"]);
    expect(result.error).toBeUndefined();
  });

  it("returns an error message for a mismatched order", async () => {
    mockReorderPortfolioImages.mockRejectedValue(
      new PortfolioImageValidationError("The provided order doesn't match this shop's portfolio."),
    );
    const result = await reorderPortfolioImagesAction("shop-1", ["img-1"]);
    expect(result.error).toBe("The provided order doesn't match this shop's portfolio.");
  });

  it("falls back to a generic message for an unexpected error", async () => {
    mockReorderPortfolioImages.mockRejectedValue(new Error("boom"));
    const result = await reorderPortfolioImagesAction("shop-1", ["img-1"]);
    expect(result.error).toBe("Couldn't save the new order. Please try again.");
  });
});

describe("setFeaturedPortfolioImageAction", () => {
  it("features the image for the signed-in caller", async () => {
    const result = await setFeaturedPortfolioImageAction("shop-1", "img-1");
    expect(mockSetFeaturedPortfolioImage).toHaveBeenCalledWith("shop-1", "user-1", "img-1");
    expect(result.error).toBeUndefined();
  });

  it("returns an error message for a non-owner", async () => {
    mockSetFeaturedPortfolioImage.mockRejectedValue(new NotPortfolioImageOwnerError());
    const result = await setFeaturedPortfolioImageAction("shop-1", "img-1");
    expect(result.error).toBe("You do not have permission to modify this portfolio piece.");
  });

  it("falls back to a generic message for an unexpected error", async () => {
    mockSetFeaturedPortfolioImage.mockRejectedValue(new Error("boom"));
    const result = await setFeaturedPortfolioImageAction("shop-1", "img-1");
    expect(result.error).toBe("Couldn't feature this piece. Please try again.");
  });
});

describe("requestBannerUploadUrlAction / confirmBannerImageAction", () => {
  it("returns upload/image URLs on success", async () => {
    mockRequestBannerUpload.mockResolvedValue({
      uploadUrl: "https://r2/upload",
      uploadFields: { key: "prod/banner.png" },
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
      uploadFields: { key: "prod/avatar.png" },
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

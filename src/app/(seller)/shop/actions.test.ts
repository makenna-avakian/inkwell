import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth/config", () => ({ auth: vi.fn() }));
vi.mock("@/server/shops/service", () => ({
  createShop: vi.fn(),
  updateShop: vi.fn(),
  requestPortfolioUploadUrl: vi.fn(),
  confirmPortfolioImage: vi.fn(),
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
  confirmPortfolioImage,
  createShop,
  requestPortfolioUploadUrl,
} from "@/server/shops/service";
import {
  confirmPortfolioImageAction,
  createShopAction,
  requestPortfolioUploadUrlAction,
} from "./actions";

const mockAuth = vi.mocked(auth);
const mockCreateShop = vi.mocked(createShop);
const mockRequestUpload = vi.mocked(requestPortfolioUploadUrl);
const mockConfirmImage = vi.mocked(confirmPortfolioImage);

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
    expect(mockCreateShop).toHaveBeenCalledWith("user-1", { bio: "Hi", socialLinks: [] });
    expect(result.formError).toBeUndefined();
  });

  it("surfaces a friendly error when a shop already exists", async () => {
    mockCreateShop.mockRejectedValue(new ShopAlreadyExistsError());
    const result = await createShopAction({ fieldErrors: {} }, formData({}));
    expect(result.formError).toBe("You already have a shop.");
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
});

describe("confirmPortfolioImageAction", () => {
  it("confirms the image", async () => {
    const result = await confirmPortfolioImageAction("shop-1", "https://x/y.png");
    expect(mockConfirmImage).toHaveBeenCalledWith("shop-1", "user-1", "https://x/y.png");
    expect(result.error).toBeUndefined();
  });
});

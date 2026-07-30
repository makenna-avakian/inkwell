import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth/config", () => ({ auth: vi.fn() }));
vi.mock("@/server/shops/service", () => ({
  saveGalleryWallLayout: vi.fn(),
  NotShopOwnerError: class NotShopOwnerError extends Error {
    constructor() {
      super("You do not have permission to modify this shop.");
    }
  },
  PortfolioImageValidationError: class PortfolioImageValidationError extends Error {},
}));

import { auth } from "@/server/auth/config";
import { NotShopOwnerError, PortfolioImageValidationError, saveGalleryWallLayout } from "@/server/shops/service";
import { saveGalleryWallLayoutAction } from "./actions";

const mockAuth = vi.mocked(auth);
const mockSaveGalleryWallLayout = vi.mocked(saveGalleryWallLayout);

const INPUT = {
  frameColor: "walnut",
  frameStyle: "thin",
  pieces: [{ portfolioImageId: "11111111-1111-1111-1111-111111111111", x: 50, y: 15 }],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
});

describe("saveGalleryWallLayoutAction", () => {
  it("calls through with the signed-in user id", async () => {
    const result = await saveGalleryWallLayoutAction("shop-1", INPUT);
    expect(mockSaveGalleryWallLayout).toHaveBeenCalledWith("shop-1", "user-1", INPUT);
    expect(result.error).toBeUndefined();
  });

  it("requires a signed-in caller", async () => {
    mockAuth.mockResolvedValue(null as never);
    const result = await saveGalleryWallLayoutAction("shop-1", INPUT);
    expect(result.error).toBe("Couldn't save the gallery wall. Please try again.");
    expect(mockSaveGalleryWallLayout).not.toHaveBeenCalled();
  });

  it("surfaces a NotShopOwnerError message", async () => {
    mockSaveGalleryWallLayout.mockRejectedValue(new NotShopOwnerError());
    const result = await saveGalleryWallLayoutAction("shop-1", INPUT);
    expect(result.error).toBe("You do not have permission to modify this shop.");
  });

  it("surfaces a PortfolioImageValidationError message", async () => {
    mockSaveGalleryWallLayout.mockRejectedValue(new PortfolioImageValidationError("Too many pieces."));
    const result = await saveGalleryWallLayoutAction("shop-1", INPUT);
    expect(result.error).toBe("Too many pieces.");
  });

  it("falls back to a generic message for an unexpected error", async () => {
    mockSaveGalleryWallLayout.mockRejectedValue(new Error("boom"));
    const result = await saveGalleryWallLayoutAction("shop-1", INPUT);
    expect(result.error).toBe("Couldn't save the gallery wall. Please try again.");
  });
});

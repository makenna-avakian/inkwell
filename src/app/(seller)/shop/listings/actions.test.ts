import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth/config", () => ({ auth: vi.fn() }));
vi.mock("@/server/listings/service", () => ({
  createListing: vi.fn(),
  updateListing: vi.fn(),
  setListingStatus: vi.fn(),
  addListingImage: vi.fn(),
  confirmListingImage: vi.fn(),
  ListingValidationError: class ListingValidationError extends Error {},
  NotListingOwnerError: class NotListingOwnerError extends Error {
    constructor() {
      super("You do not have permission to modify this listing.");
    }
  },
}));

import { auth } from "@/server/auth/config";
import { createListing, setListingStatus } from "@/server/listings/service";
import { createListingAction, setListingStatusAction } from "./actions";

const mockAuth = vi.mocked(auth);
const mockCreateListing = vi.mocked(createListing);
const mockSetListingStatus = vi.mocked(setListingStatus);

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
});

function formData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

describe("createListingAction", () => {
  it("converts dollars to cents for the price field", async () => {
    await createListingAction(
      "shop-1",
      { fieldErrors: {} },
      formData({ title: "Sketch", price: "12.50" }),
    );
    expect(mockCreateListing).toHaveBeenCalledWith(
      "shop-1",
      expect.objectContaining({ priceCents: 1250 }),
    );
  });
});

describe("setListingStatusAction", () => {
  it("calls through with the signed-in user id", async () => {
    await setListingStatusAction("listing-1", "sold");
    expect(mockSetListingStatus).toHaveBeenCalledWith("listing-1", "user-1", "sold");
  });
});

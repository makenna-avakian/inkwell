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
import {
  addListingImage,
  confirmListingImage,
  createListing,
  ListingValidationError,
  NotListingOwnerError,
  setListingStatus,
  updateListing,
} from "@/server/listings/service";
import {
  confirmListingImageAction,
  createListingAction,
  requestListingUploadUrlAction,
  setListingStatusAction,
  updateListingAction,
} from "./actions";

const mockAuth = vi.mocked(auth);
const mockCreateListing = vi.mocked(createListing);
const mockUpdateListing = vi.mocked(updateListing);
const mockSetListingStatus = vi.mocked(setListingStatus);
const mockAddListingImage = vi.mocked(addListingImage);
const mockConfirmListingImage = vi.mocked(confirmListingImage);

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

  it("surfaces a ListingValidationError message", async () => {
    mockCreateListing.mockRejectedValue(new ListingValidationError("Title is required."));
    const result = await createListingAction(
      "shop-1",
      { fieldErrors: {} },
      formData({ title: "", price: "10" }),
    );
    expect(result.formError).toBe("Title is required.");
  });

  it("falls back to a generic message for an unexpected error", async () => {
    mockCreateListing.mockRejectedValue(new Error("boom"));
    const result = await createListingAction(
      "shop-1",
      { fieldErrors: {} },
      formData({ title: "Sketch", price: "10" }),
    );
    expect(result.formError).toBe("Something went wrong. Please try again.");
  });
});

describe("updateListingAction", () => {
  it("converts dollars to cents and calls through with the signed-in user id", async () => {
    await updateListingAction(
      "listing-1",
      { fieldErrors: {} },
      formData({ title: "Sketch", price: "20" }),
    );
    expect(mockUpdateListing).toHaveBeenCalledWith(
      "listing-1",
      "user-1",
      expect.objectContaining({ priceCents: 2000 }),
    );
  });

  it("surfaces a NotListingOwnerError message", async () => {
    mockUpdateListing.mockRejectedValue(new NotListingOwnerError());
    const result = await updateListingAction(
      "listing-1",
      { fieldErrors: {} },
      formData({ title: "Sketch", price: "20" }),
    );
    expect(result.formError).toBe("You do not have permission to modify this listing.");
  });

  it("falls back to a generic message for an unexpected error", async () => {
    mockUpdateListing.mockRejectedValue(new Error("boom"));
    const result = await updateListingAction(
      "listing-1",
      { fieldErrors: {} },
      formData({ title: "Sketch", price: "20" }),
    );
    expect(result.formError).toBe("Something went wrong. Please try again.");
  });
});

describe("setListingStatusAction", () => {
  it("calls through with the signed-in user id", async () => {
    await setListingStatusAction("listing-1", "sold");
    expect(mockSetListingStatus).toHaveBeenCalledWith("listing-1", "user-1", "sold");
  });

  it("surfaces a NotListingOwnerError message", async () => {
    mockSetListingStatus.mockRejectedValue(new NotListingOwnerError());
    const result = await setListingStatusAction("listing-1", "sold");
    expect(result.error).toBe("You do not have permission to modify this listing.");
  });

  it("falls back to a generic message for an unexpected error", async () => {
    mockSetListingStatus.mockRejectedValue(new Error("boom"));
    const result = await setListingStatusAction("listing-1", "sold");
    expect(result.error).toBe("Something went wrong. Please try again.");
  });
});

describe("requestListingUploadUrlAction", () => {
  it("returns the upload URL and image URL on success", async () => {
    mockAddListingImage.mockResolvedValue({
      uploadUrl: "https://r2.example.com/put",
      imageUrl: "https://media.example.com/listing.png",
      objectKey: "listings/listing-1/x.png",
    });
    const result = await requestListingUploadUrlAction("listing-1", "x.png", "image/png", 1024);
    expect(mockAddListingImage).toHaveBeenCalledWith("listing-1", "user-1", "x.png", "image/png", 1024);
    expect(result.uploadUrl).toBe("https://r2.example.com/put");
    expect(result.imageUrl).toBe("https://media.example.com/listing.png");
  });

  it("surfaces an Error message", async () => {
    mockAddListingImage.mockRejectedValue(new Error("Unsupported file type."));
    const result = await requestListingUploadUrlAction("listing-1", "x.gif", "image/gif", 1024);
    expect(result.error).toBe("Unsupported file type.");
  });

  it("falls back to a generic message for a non-Error rejection", async () => {
    mockAddListingImage.mockRejectedValue("nope");
    const result = await requestListingUploadUrlAction("listing-1", "x.png", "image/png", 1024);
    expect(result.error).toBe("Couldn't start upload. Please try again.");
  });
});

describe("confirmListingImageAction", () => {
  it("calls through with the signed-in user id", async () => {
    const result = await confirmListingImageAction("listing-1", "https://media.example.com/listing.png");
    expect(mockConfirmListingImage).toHaveBeenCalledWith(
      "listing-1",
      "user-1",
      "https://media.example.com/listing.png",
    );
    expect(result).toEqual({});
  });

  it("surfaces a NotListingOwnerError message", async () => {
    mockConfirmListingImage.mockRejectedValue(new NotListingOwnerError());
    const result = await confirmListingImageAction("listing-1", "https://media.example.com/listing.png");
    expect(result.error).toBe("You do not have permission to modify this listing.");
  });

  it("falls back to a generic message for an unexpected error", async () => {
    mockConfirmListingImage.mockRejectedValue(new Error("boom"));
    const result = await confirmListingImageAction("listing-1", "https://media.example.com/listing.png");
    expect(result.error).toBe("Couldn't save the image. Please try again.");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/requests/repository", () => ({
  countActiveRequestsForShop: vi.fn(),
  createMessageRow: vi.fn(),
  createRequestRow: vi.fn(),
  findRequestById: vi.fn(),
  findRequestWithParticipants: vi.fn(),
  findRequestsInvolvingUser: vi.fn(),
  getLatestMessageTimestamp: vi.fn(),
  getReadReceipt: vi.fn(),
  joinWaitlistRow: vi.fn(),
  listMessagesForRequest: vi.fn(),
  listRequestsForBuyer: vi.fn(),
  listRequestsForShop: vi.fn(),
  setRequestStatusRow: vi.fn(),
  upsertReadReceipt: vi.fn(),
}));

vi.mock("@/server/shops/service", () => ({
  getPublishedRuleSet: vi.fn(),
}));

vi.mock("@/server/shops/repository", () => ({
  setSlotStateRow: vi.fn(),
}));

vi.mock("@/server/shops/storage", () => ({
  createPresignedUpload: vi.fn(),
  validateImageUpload: vi.fn(),
}));

import {
  countActiveRequestsForShop,
  createMessageRow,
  createRequestRow,
  findRequestWithParticipants,
  findRequestsInvolvingUser,
  getLatestMessageTimestamp,
  getReadReceipt,
  joinWaitlistRow,
  listMessagesForRequest,
  listRequestsForBuyer,
  listRequestsForShop,
  setRequestStatusRow,
  upsertReadReceipt,
} from "@/server/requests/repository";
import { getPublishedRuleSet } from "@/server/shops/service";
import { setSlotStateRow } from "@/server/shops/repository";
import { createPresignedUpload, validateImageUpload } from "@/server/shops/storage";
import {
  NotRequestParticipantError,
  NotShopOwnerForRequestError,
  RequestValidationError,
  acceptRequest,
  declineRequest,
  enforceQueueLimit,
  getRequestWithMessages,
  getRequestsForBuyer,
  getRequestsForShop,
  getUnreadSummary,
  joinWaitlist,
  markRequestSeen,
  postMessage,
  requestReferenceImageUpload,
  submitRequest,
} from "@/server/requests/service";

const mockGetPublishedRuleSet = vi.mocked(getPublishedRuleSet);
const mockCreateRequestRow = vi.mocked(createRequestRow);
const mockCountActive = vi.mocked(countActiveRequestsForShop);
const mockSetSlotStateRow = vi.mocked(setSlotStateRow);
const mockFindRequestWithParticipants = vi.mocked(findRequestWithParticipants);
const mockSetRequestStatusRow = vi.mocked(setRequestStatusRow);
const mockJoinWaitlistRow = vi.mocked(joinWaitlistRow);
const mockCreateMessageRow = vi.mocked(createMessageRow);
const mockListMessagesForRequest = vi.mocked(listMessagesForRequest);
const mockUpsertReadReceipt = vi.mocked(upsertReadReceipt);
const mockListRequestsForShop = vi.mocked(listRequestsForShop);
const mockListRequestsForBuyer = vi.mocked(listRequestsForBuyer);
const mockFindRequestsInvolvingUser = vi.mocked(findRequestsInvolvingUser);
const mockGetLatestMessageTimestamp = vi.mocked(getLatestMessageTimestamp);
const mockGetReadReceipt = vi.mocked(getReadReceipt);
const mockCreatePresignedUpload = vi.mocked(createPresignedUpload);
const mockValidateImageUpload = vi.mocked(validateImageUpload);

const PUBLISHED = {
  version: {
    id: "v1",
    shopId: "shop-1",
    version: 1,
    tiers: [{ id: "t1", name: "Sketch", description: "", priceCents: 1000 }],
    addOns: [],
    rulesContent: [],
    publishedAt: new Date(),
  },
  slotState: "open" as const,
  maxQueue: 5,
};

const REQUEST = {
  id: "req-1",
  shopId: "shop-1",
  buyerId: "buyer-1",
  ruleVersionId: "v1",
  tierId: "t1",
  addOnIds: [],
  description: "A pet portrait",
  referenceImageUrls: [],
  budgetCents: 5000,
  deadlinePreference: null,
  status: "requested" as const,
  declineReason: null,
  createdAt: new Date(),
  respondedAt: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("submitRequest (BR-1)", () => {
  it("rejects when the shop hasn't published rules", async () => {
    mockGetPublishedRuleSet.mockResolvedValue(null);
    await expect(
      submitRequest("buyer-1", "shop-1", { tierId: "t1", description: "x" }),
    ).rejects.toThrow(RequestValidationError);
  });

  it("rejects when the shop is closed", async () => {
    mockGetPublishedRuleSet.mockResolvedValue({ ...PUBLISHED, slotState: "closed" });
    await expect(
      submitRequest("buyer-1", "shop-1", { tierId: "t1", description: "x" }),
    ).rejects.toThrow(RequestValidationError);
  });

  it("rejects a tier not offered by the shop", async () => {
    mockGetPublishedRuleSet.mockResolvedValue(PUBLISHED);
    await expect(
      submitRequest("buyer-1", "shop-1", { tierId: "nonexistent", description: "x" }),
    ).rejects.toThrow(RequestValidationError);
  });

  it("creates a request pinned to the currently published version", async () => {
    mockGetPublishedRuleSet.mockResolvedValue(PUBLISHED);
    mockCreateRequestRow.mockResolvedValue(REQUEST);
    mockCountActive.mockResolvedValue(1);

    await submitRequest("buyer-1", "shop-1", { tierId: "t1", description: "A pet portrait" });

    expect(mockCreateRequestRow).toHaveBeenCalledWith(
      expect.objectContaining({ ruleVersionId: "v1", tierId: "t1" }),
    );
  });
});

describe("enforceQueueLimit (BR-6)", () => {
  it("auto-closes when active count reaches maxQueue", async () => {
    mockGetPublishedRuleSet.mockResolvedValue(PUBLISHED);
    mockCountActive.mockResolvedValue(5);

    await enforceQueueLimit("shop-1");
    expect(mockSetSlotStateRow).toHaveBeenCalledWith("shop-1", "closed");
  });

  it("does not close when under the limit", async () => {
    mockGetPublishedRuleSet.mockResolvedValue(PUBLISHED);
    mockCountActive.mockResolvedValue(1);

    await enforceQueueLimit("shop-1");
    expect(mockSetSlotStateRow).not.toHaveBeenCalled();
  });
});

describe("joinWaitlist (BR-3)", () => {
  it("rejects when the shop isn't in waitlist mode", async () => {
    mockGetPublishedRuleSet.mockResolvedValue({ ...PUBLISHED, slotState: "open" });
    await expect(joinWaitlist("buyer-1", "shop-1")).rejects.toThrow(RequestValidationError);
  });

  it("joins idempotently when the shop is waitlisted", async () => {
    mockGetPublishedRuleSet.mockResolvedValue({ ...PUBLISHED, slotState: "waitlist" });
    await joinWaitlist("buyer-1", "shop-1");
    await joinWaitlist("buyer-1", "shop-1");
    expect(mockJoinWaitlistRow).toHaveBeenCalledTimes(2); // repository layer handles the actual idempotency
  });
});

describe("acceptRequest / declineRequest (BR-2, BR-4)", () => {
  it("rejects acceptRequest from a non-owner", async () => {
    mockFindRequestWithParticipants.mockResolvedValue({
      request: REQUEST,
      shopOwnerId: "actual-owner",
    });
    await expect(acceptRequest("req-1", "someone-else")).rejects.toThrow(
      NotShopOwnerForRequestError,
    );
  });

  it("accepts a request without creating an Order (forward dependency documented)", async () => {
    mockFindRequestWithParticipants.mockResolvedValue({
      request: REQUEST,
      shopOwnerId: "owner-1",
    });
    mockSetRequestStatusRow.mockResolvedValue({ ...REQUEST, status: "accepted" });

    await acceptRequest("req-1", "owner-1");
    expect(mockSetRequestStatusRow).toHaveBeenCalledWith("req-1", "accepted");
  });

  it("rejects declineRequest with an empty reason", async () => {
    mockFindRequestWithParticipants.mockResolvedValue({
      request: REQUEST,
      shopOwnerId: "owner-1",
    });
    await expect(declineRequest("req-1", "owner-1", "   ")).rejects.toThrow(
      RequestValidationError,
    );
  });

  it("declines a request with a trimmed reason", async () => {
    mockFindRequestWithParticipants.mockResolvedValue({
      request: REQUEST,
      shopOwnerId: "owner-1",
    });
    mockSetRequestStatusRow.mockResolvedValue({ ...REQUEST, status: "declined" });

    await declineRequest("req-1", "owner-1", "  Not my style  ");

    expect(mockSetRequestStatusRow).toHaveBeenCalledWith("req-1", "declined", "Not my style");
  });

  it("rejects acting on a request that's already been responded to", async () => {
    mockFindRequestWithParticipants.mockResolvedValue({
      request: { ...REQUEST, status: "accepted" },
      shopOwnerId: "owner-1",
    });
    await expect(acceptRequest("req-1", "owner-1")).rejects.toThrow(RequestValidationError);
  });
});

describe("requestReferenceImageUpload", () => {
  it("validates the image and delegates to Unit 2's presigned upload", async () => {
    mockCreatePresignedUpload.mockResolvedValue({
      uploadUrl: "https://r2/upload",
      uploadFields: { key: "shops/requests/x.png" },
      imageUrl: "https://media/x.png",
      objectKey: "shops/requests/x.png",
    });

    const result = await requestReferenceImageUpload("photo.png", "image/png", 1000);

    expect(mockValidateImageUpload).toHaveBeenCalledWith("image/png", 1000);
    expect(result.imageUrl).toBe("https://media/x.png");
  });
});

describe("postMessage", () => {
  it("rejects a non-participant", async () => {
    mockFindRequestWithParticipants.mockResolvedValue({
      request: REQUEST,
      shopOwnerId: "owner-1",
    });
    await expect(postMessage("req-1", "someone-else", "hi")).rejects.toThrow(
      NotRequestParticipantError,
    );
  });

  it("rejects an empty message", async () => {
    mockFindRequestWithParticipants.mockResolvedValue({
      request: REQUEST,
      shopOwnerId: "owner-1",
    });
    await expect(postMessage("req-1", "buyer-1", "   ")).rejects.toThrow(RequestValidationError);
  });

  it("posts a trimmed message from a participant", async () => {
    mockFindRequestWithParticipants.mockResolvedValue({
      request: REQUEST,
      shopOwnerId: "owner-1",
    });
    mockCreateMessageRow.mockResolvedValue({
      id: "msg-1",
      requestId: "req-1",
      senderId: "buyer-1",
      body: "Hello",
      attachmentUrls: [],
      createdAt: new Date(),
    });

    await postMessage("req-1", "buyer-1", "  Hello  ");

    expect(mockCreateMessageRow).toHaveBeenCalledWith("req-1", "buyer-1", "Hello", []);
  });
});

describe("getRequestWithMessages / markRequestSeen", () => {
  it("rejects a non-participant", async () => {
    mockFindRequestWithParticipants.mockResolvedValue({
      request: REQUEST,
      shopOwnerId: "owner-1",
    });
    await expect(getRequestWithMessages("req-1", "someone-else")).rejects.toThrow(
      NotRequestParticipantError,
    );
  });

  it("returns the request with its messages for a participant", async () => {
    mockFindRequestWithParticipants.mockResolvedValue({
      request: REQUEST,
      shopOwnerId: "owner-1",
    });
    mockListMessagesForRequest.mockResolvedValue([]);

    const result = await getRequestWithMessages("req-1", "buyer-1");
    expect(result.request).toEqual(REQUEST);
    expect(result.messages).toEqual([]);
  });

  it("markRequestSeen upserts a read receipt for a participant", async () => {
    mockFindRequestWithParticipants.mockResolvedValue({
      request: REQUEST,
      shopOwnerId: "owner-1",
    });

    await markRequestSeen("req-1", "buyer-1");

    expect(mockUpsertReadReceipt).toHaveBeenCalledWith("req-1", "buyer-1");
  });
});

describe("getRequestsForShop / getRequestsForBuyer", () => {
  it("delegate to the repository", async () => {
    mockListRequestsForShop.mockResolvedValue([REQUEST]);
    mockListRequestsForBuyer.mockResolvedValue([REQUEST]);

    await expect(getRequestsForShop("shop-1")).resolves.toEqual([REQUEST]);
    await expect(getRequestsForBuyer("buyer-1")).resolves.toEqual([REQUEST]);
  });
});

describe("getUnreadSummary (BR-7)", () => {
  it("marks a request unread when there's message activity after the last read receipt", async () => {
    mockFindRequestsInvolvingUser.mockResolvedValue([{ request: REQUEST, shopOwnerId: "owner-1" }]);
    mockGetLatestMessageTimestamp.mockResolvedValue(new Date("2026-01-02"));
    mockGetReadReceipt.mockResolvedValue({
      requestId: "req-1",
      userId: "buyer-1",
      lastReadAt: new Date("2026-01-01"),
    });

    const result = await getUnreadSummary("buyer-1");

    expect(result).toEqual([{ requestId: "req-1", unread: true }]);
  });

  it("marks a request read when there's no activity since the last read receipt", async () => {
    mockFindRequestsInvolvingUser.mockResolvedValue([{ request: REQUEST, shopOwnerId: "owner-1" }]);
    mockGetLatestMessageTimestamp.mockResolvedValue(undefined);
    mockGetReadReceipt.mockResolvedValue({
      requestId: "req-1",
      userId: "buyer-1",
      lastReadAt: new Date("2026-01-01"),
    });

    const result = await getUnreadSummary("buyer-1");

    expect(result).toEqual([{ requestId: "req-1", unread: false }]);
  });
});

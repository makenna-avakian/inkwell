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
  createRequestRow,
  findRequestWithParticipants,
  joinWaitlistRow,
  setRequestStatusRow,
} from "@/server/requests/repository";
import { getPublishedRuleSet } from "@/server/shops/service";
import { setSlotStateRow } from "@/server/shops/repository";
import {
  NotShopOwnerForRequestError,
  RequestValidationError,
  acceptRequest,
  declineRequest,
  enforceQueueLimit,
  joinWaitlist,
  submitRequest,
} from "@/server/requests/service";

const mockGetPublishedRuleSet = vi.mocked(getPublishedRuleSet);
const mockCreateRequestRow = vi.mocked(createRequestRow);
const mockCountActive = vi.mocked(countActiveRequestsForShop);
const mockSetSlotStateRow = vi.mocked(setSlotStateRow);
const mockFindRequestWithParticipants = vi.mocked(findRequestWithParticipants);
const mockSetRequestStatusRow = vi.mocked(setRequestStatusRow);
const mockJoinWaitlistRow = vi.mocked(joinWaitlistRow);

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
});

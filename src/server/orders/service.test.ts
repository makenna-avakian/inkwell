import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/orders/payment", () => ({
  computeFees: vi.fn((subtotal: number) => ({
    platformFeeCents: Math.round(subtotal * 0.1),
    sellerNetCents: subtotal - Math.round(subtotal * 0.1),
  })),
  hasPayoutsEnabled: vi.fn(),
  onboardSeller: vi.fn(),
  createCheckoutSession: vi.fn(),
  captureAndRelease: vi.fn(),
  cancelOrderAuthorization: vi.fn(),
  retrieveTransferId: vi.fn(),
  constructWebhookEvent: vi.fn(),
}));

vi.mock("@/server/orders/repository", () => ({
  createOrderRow: vi.fn(),
  findOrderById: vi.fn(),
  updateOrderRow: vi.fn(),
  listOrdersForBuyer: vi.fn(),
  listOrdersForSeller: vi.fn(),
  getShopStripeAccountId: vi.fn(),
  setShopStripeAccountId: vi.fn(),
  isEventProcessed: vi.fn(),
  markEventProcessed: vi.fn(),
}));

vi.mock("@/server/requests/service", () => ({
  acceptRequest: vi.fn(),
  postMessage: vi.fn(),
}));

vi.mock("@/server/shops/repository", () => ({
  getRuleVersionById: vi.fn(),
  findShopById: vi.fn(),
  findShopByUserId: vi.fn(),
}));

vi.mock("@/server/listings/repository", () => ({
  findListingById: vi.fn(),
  findListingWithShopOwner: vi.fn(),
  setListingStatusRow: vi.fn(),
}));

import { hasPayoutsEnabled, createCheckoutSession, captureAndRelease } from "@/server/orders/payment";
import {
  createOrderRow,
  findOrderById,
  getShopStripeAccountId,
  updateOrderRow,
  isEventProcessed,
} from "@/server/orders/repository";
import { acceptRequest } from "@/server/requests/service";
import { getRuleVersionById, findShopById, findShopByUserId } from "@/server/shops/repository";
import {
  NotOrderParticipantError,
  OrderValidationError,
  acceptAndCreateOrder,
  approveDelivery,
  cancelOrder,
  getCheckoutUrlForOrder,
  markInProgress,
  handleWebhookEvent,
} from "@/server/orders/service";

const mockHasPayoutsEnabled = vi.mocked(hasPayoutsEnabled);
const mockCreateCheckoutSession = vi.mocked(createCheckoutSession);
const mockCaptureAndRelease = vi.mocked(captureAndRelease);
const mockCreateOrderRow = vi.mocked(createOrderRow);
const mockFindOrderById = vi.mocked(findOrderById);
const mockGetShopStripeAccountId = vi.mocked(getShopStripeAccountId);
const mockUpdateOrderRow = vi.mocked(updateOrderRow);
const mockIsEventProcessed = vi.mocked(isEventProcessed);
const mockAcceptRequest = vi.mocked(acceptRequest);
const mockGetRuleVersionById = vi.mocked(getRuleVersionById);
const mockFindShopById = vi.mocked(findShopById);
const mockFindShopByUserId = vi.mocked(findShopByUserId);

const REQUEST = {
  id: "req-1",
  shopId: "shop-1",
  buyerId: "buyer-1",
  ruleVersionId: "v1",
  tierId: "t1",
  addOnIds: ["a1"],
  description: "x",
  referenceImageUrls: [],
  budgetCents: null,
  deadlinePreference: null,
  status: "accepted" as const,
  declineReason: null,
  createdAt: new Date(),
  respondedAt: new Date(),
};

const RULE_VERSION = {
  id: "v1",
  shopId: "shop-1",
  version: 1,
  tiers: [{ id: "t1", priceCents: 10000 }],
  addOns: [{ id: "a1", priceDeltaCents: 2000 }],
  rulesContent: [],
  publishedAt: new Date(),
};

const ORDER = {
  id: "order-1",
  requestId: "req-1",
  listingId: null,
  buyerId: "buyer-1",
  sellerId: "seller-1",
  subtotalCents: 12000,
  platformFeeCents: 1200,
  sellerNetCents: 10800,
  status: "accepted" as const,
  stripePaymentIntentId: "pi_123",
  stripeTransferId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("acceptAndCreateOrder (BR-2 payouts gate, fee computation)", () => {
  it("rejects when the shop's Stripe account isn't payout-eligible", async () => {
    mockAcceptRequest.mockResolvedValue(REQUEST);
    mockGetRuleVersionById.mockResolvedValue(RULE_VERSION);
    mockFindShopById.mockResolvedValue({
      id: "shop-1",
      userId: "seller-1",
      bannerImageUrl: null,
      avatarImageUrl: null,
      bio: null,
      socialLinks: [],
      stripeConnectAccountId: null,
      createdAt: new Date(),
    });
    mockGetShopStripeAccountId.mockResolvedValue(null);
    mockHasPayoutsEnabled.mockResolvedValue(false);

    await expect(acceptAndCreateOrder("req-1", "seller-1")).rejects.toThrow(
      OrderValidationError,
    );
  });

  it("computes subtotal from tier + add-ons and creates the checkout session", async () => {
    mockAcceptRequest.mockResolvedValue(REQUEST);
    mockGetRuleVersionById.mockResolvedValue(RULE_VERSION);
    mockFindShopById.mockResolvedValue({
      id: "shop-1",
      userId: "seller-1",
      bannerImageUrl: null,
      avatarImageUrl: null,
      bio: null,
      socialLinks: [],
      stripeConnectAccountId: "acct_123",
      createdAt: new Date(),
    });
    mockGetShopStripeAccountId.mockResolvedValue("acct_123");
    mockHasPayoutsEnabled.mockResolvedValue(true);
    mockCreateOrderRow.mockResolvedValue(ORDER);
    mockCreateCheckoutSession.mockResolvedValue({
      sessionId: "cs_1",
      checkoutUrl: "https://checkout.stripe.com/cs_1",
    });

    const { checkoutUrl } = await acceptAndCreateOrder("req-1", "seller-1");

    expect(mockCreateOrderRow).toHaveBeenCalledWith(
      expect.objectContaining({ subtotalCents: 12000 }), // 10000 tier + 2000 add-on
    );
    expect(mockCreateCheckoutSession).toHaveBeenCalledWith(
      "order-1",
      "acct_123",
      12000,
      1200,
      "manual",
    );
    expect(checkoutUrl).toBe("https://checkout.stripe.com/cs_1");
  });
});

describe("getCheckoutUrlForOrder", () => {
  it("rejects a non-buyer", async () => {
    mockFindOrderById.mockResolvedValue(ORDER);
    await expect(getCheckoutUrlForOrder("order-1", "someone-else")).rejects.toThrow(
      NotOrderParticipantError,
    );
  });

  it("rejects an order that's already been paid for", async () => {
    mockFindOrderById.mockResolvedValue({ ...ORDER, stripePaymentIntentId: "pi_already" });
    await expect(getCheckoutUrlForOrder("order-1", "buyer-1")).rejects.toThrow(
      OrderValidationError,
    );
  });

  it("regenerates a checkout session for an unpaid order", async () => {
    mockFindOrderById.mockResolvedValue({ ...ORDER, stripePaymentIntentId: null });
    mockFindShopByUserId.mockResolvedValue({
      id: "shop-1",
      userId: "seller-1",
      bannerImageUrl: null,
      avatarImageUrl: null,
      bio: null,
      socialLinks: [],
      stripeConnectAccountId: "acct_123",
      createdAt: new Date(),
    });
    mockGetShopStripeAccountId.mockResolvedValue("acct_123");
    mockHasPayoutsEnabled.mockResolvedValue(true);
    mockCreateCheckoutSession.mockResolvedValue({
      sessionId: "cs_1",
      checkoutUrl: "https://checkout.stripe.com/cs_1",
    });

    const checkoutUrl = await getCheckoutUrlForOrder("order-1", "buyer-1");

    expect(checkoutUrl).toBe("https://checkout.stripe.com/cs_1");
    expect(mockCreateCheckoutSession).toHaveBeenCalledWith(
      "order-1",
      "acct_123",
      12000,
      1200,
      "manual",
    );
  });
});

describe("markInProgress (BR-3 object-level auth)", () => {
  it("rejects a non-seller", async () => {
    mockFindOrderById.mockResolvedValue(ORDER);
    await expect(markInProgress("order-1", "someone-else")).rejects.toThrow(
      NotOrderParticipantError,
    );
  });

  it("rejects an invalid transition", async () => {
    mockFindOrderById.mockResolvedValue({ ...ORDER, status: "completed" });
    await expect(markInProgress("order-1", "seller-1")).rejects.toThrow(OrderValidationError);
  });
});

describe("approveDelivery", () => {
  it("captures, releases, and marks the order completed", async () => {
    mockFindOrderById.mockResolvedValue({ ...ORDER, status: "delivered" });
    mockUpdateOrderRow.mockResolvedValue({ ...ORDER, status: "completed" });

    await approveDelivery("order-1", "buyer-1");

    expect(mockCaptureAndRelease).toHaveBeenCalledWith("pi_123", "order-1");
    expect(mockUpdateOrderRow).toHaveBeenCalledWith(
      "order-1",
      expect.objectContaining({ status: "completed" }),
    );
  });
});

describe("cancelOrder (BR-4, Question 2: B)", () => {
  it("rejects cancelling a delivered order", async () => {
    mockFindOrderById.mockResolvedValue({ ...ORDER, status: "delivered" });
    await expect(cancelOrder("order-1", "buyer-1")).rejects.toThrow(OrderValidationError);
  });
});

describe("handleWebhookEvent (BR-7 idempotency)", () => {
  it("is a no-op for an already-processed event", async () => {
    mockIsEventProcessed.mockResolvedValue(true);
    await handleWebhookEvent({ id: "evt_1", type: "checkout.session.completed" } as never);
    expect(mockUpdateOrderRow).not.toHaveBeenCalled();
  });
});

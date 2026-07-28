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

import {
  hasPayoutsEnabled,
  createCheckoutSession,
  captureAndRelease,
  cancelOrderAuthorization,
  onboardSeller,
  retrieveTransferId,
} from "@/server/orders/payment";
import {
  createOrderRow,
  findOrderById,
  getShopStripeAccountId,
  setShopStripeAccountId,
  updateOrderRow,
  isEventProcessed,
  markEventProcessed,
  listOrdersForBuyer,
  listOrdersForSeller,
} from "@/server/orders/repository";
import { acceptRequest, postMessage } from "@/server/requests/service";
import { getRuleVersionById, findShopById, findShopByUserId } from "@/server/shops/repository";
import { setListingStatusRow } from "@/server/listings/repository";
import {
  NotOrderParticipantError,
  OrderValidationError,
  acceptAndCreateOrder,
  approveDelivery,
  cancelOrder,
  getCheckoutUrlForOrder,
  getOrder,
  getOrderHistoryForBuyer,
  getOrderHistoryForSeller,
  markInProgress,
  onboardSellerAction,
  requestRevision,
  submitForReview,
  handleWebhookEvent,
} from "@/server/orders/service";

const mockHasPayoutsEnabled = vi.mocked(hasPayoutsEnabled);
const mockCreateCheckoutSession = vi.mocked(createCheckoutSession);
const mockCaptureAndRelease = vi.mocked(captureAndRelease);
const mockCancelOrderAuthorization = vi.mocked(cancelOrderAuthorization);
const mockOnboardSeller = vi.mocked(onboardSeller);
const mockRetrieveTransferId = vi.mocked(retrieveTransferId);
const mockCreateOrderRow = vi.mocked(createOrderRow);
const mockFindOrderById = vi.mocked(findOrderById);
const mockGetShopStripeAccountId = vi.mocked(getShopStripeAccountId);
const mockSetShopStripeAccountId = vi.mocked(setShopStripeAccountId);
const mockUpdateOrderRow = vi.mocked(updateOrderRow);
const mockIsEventProcessed = vi.mocked(isEventProcessed);
const mockMarkEventProcessed = vi.mocked(markEventProcessed);
const mockListOrdersForBuyer = vi.mocked(listOrdersForBuyer);
const mockListOrdersForSeller = vi.mocked(listOrdersForSeller);
const mockAcceptRequest = vi.mocked(acceptRequest);
const mockPostMessage = vi.mocked(postMessage);
const mockGetRuleVersionById = vi.mocked(getRuleVersionById);
const mockFindShopById = vi.mocked(findShopById);
const mockFindShopByUserId = vi.mocked(findShopByUserId);
const mockSetListingStatusRow = vi.mocked(setListingStatusRow);

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
      shopName: null,
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
      shopName: null,
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
      shopName: null,
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

describe("onboardSellerAction", () => {
  it("rejects a caller who doesn't own the shop", async () => {
    mockFindShopById.mockResolvedValue({
      id: "shop-1",
      userId: "seller-1",
      shopName: null,
      bannerImageUrl: null,
      avatarImageUrl: null,
      bio: null,
      socialLinks: [],
      stripeConnectAccountId: null,
      createdAt: new Date(),
    });
    await expect(onboardSellerAction("shop-1", "someone-else")).rejects.toThrow(
      NotOrderParticipantError,
    );
  });

  it("persists the new Stripe account id only the first time", async () => {
    mockFindShopById.mockResolvedValue({
      id: "shop-1",
      userId: "seller-1",
      shopName: null,
      bannerImageUrl: null,
      avatarImageUrl: null,
      bio: null,
      socialLinks: [],
      stripeConnectAccountId: null,
      createdAt: new Date(),
    });
    mockGetShopStripeAccountId.mockResolvedValue(null);
    mockOnboardSeller.mockResolvedValue({
      accountId: "acct_new",
      onboardingUrl: "https://connect.stripe.com/setup",
    });

    const url = await onboardSellerAction("shop-1", "seller-1");

    expect(mockSetShopStripeAccountId).toHaveBeenCalledWith("shop-1", "acct_new");
    expect(url).toBe("https://connect.stripe.com/setup");
  });

  it("does not re-persist the account id when one already exists", async () => {
    mockFindShopById.mockResolvedValue({
      id: "shop-1",
      userId: "seller-1",
      shopName: null,
      bannerImageUrl: null,
      avatarImageUrl: null,
      bio: null,
      socialLinks: [],
      stripeConnectAccountId: "acct_existing",
      createdAt: new Date(),
    });
    mockGetShopStripeAccountId.mockResolvedValue("acct_existing");
    mockOnboardSeller.mockResolvedValue({
      accountId: "acct_existing",
      onboardingUrl: "https://connect.stripe.com/setup",
    });

    await onboardSellerAction("shop-1", "seller-1");

    expect(mockSetShopStripeAccountId).not.toHaveBeenCalled();
  });
});

describe("submitForReview", () => {
  it("rejects a non-seller", async () => {
    mockFindOrderById.mockResolvedValue(ORDER);
    await expect(submitForReview("order-1", "someone-else")).rejects.toThrow(
      NotOrderParticipantError,
    );
  });

  it("transitions an in-progress order to delivered", async () => {
    mockFindOrderById.mockResolvedValue({ ...ORDER, status: "in_progress" });
    mockUpdateOrderRow.mockResolvedValue({ ...ORDER, status: "delivered" });

    await submitForReview("order-1", "seller-1");

    expect(mockUpdateOrderRow).toHaveBeenCalledWith(
      "order-1",
      expect.objectContaining({ status: "delivered" }),
    );
  });
});

describe("requestRevision", () => {
  it("rejects a non-buyer", async () => {
    mockFindOrderById.mockResolvedValue({ ...ORDER, status: "delivered" });
    await expect(requestRevision("order-1", "someone-else", "fix this")).rejects.toThrow(
      NotOrderParticipantError,
    );
  });

  it("transitions back to in_progress and posts the feedback to the request thread", async () => {
    mockFindOrderById.mockResolvedValue({ ...ORDER, status: "delivered" });
    mockUpdateOrderRow.mockResolvedValue({ ...ORDER, status: "in_progress" });

    await requestRevision("order-1", "buyer-1", "Please make it bluer");

    expect(mockPostMessage).toHaveBeenCalledWith("req-1", "buyer-1", "Please make it bluer");
    expect(mockUpdateOrderRow).toHaveBeenCalledWith(
      "order-1",
      expect.objectContaining({ status: "in_progress" }),
    );
  });

  it("does not post a message when the order has no associated request (buy-now)", async () => {
    mockFindOrderById.mockResolvedValue({ ...ORDER, requestId: null, status: "delivered" });
    mockUpdateOrderRow.mockResolvedValue({ ...ORDER, status: "in_progress" });

    await requestRevision("order-1", "buyer-1", "feedback");

    expect(mockPostMessage).not.toHaveBeenCalled();
  });
});

describe("approveDelivery — additional guards", () => {
  it("rejects an order not ready for approval", async () => {
    mockFindOrderById.mockResolvedValue({ ...ORDER, status: "cancelled" });
    await expect(approveDelivery("order-1", "buyer-1")).rejects.toThrow(OrderValidationError);
  });

  it("rejects a non-buyer", async () => {
    mockFindOrderById.mockResolvedValue({ ...ORDER, status: "delivered" });
    await expect(approveDelivery("order-1", "someone-else")).rejects.toThrow(
      NotOrderParticipantError,
    );
  });

  it("records the best-effort transfer id when available", async () => {
    mockFindOrderById.mockResolvedValue({ ...ORDER, status: "delivered" });
    mockRetrieveTransferId.mockResolvedValue("tr_1");
    mockUpdateOrderRow.mockResolvedValue({ ...ORDER, status: "completed", stripeTransferId: "tr_1" });

    await approveDelivery("order-1", "buyer-1");

    expect(mockUpdateOrderRow).toHaveBeenCalledWith("order-1", {
      status: "completed",
      stripeTransferId: "tr_1",
    });
  });
});

describe("cancelOrder — additional cases", () => {
  it("rejects a non-participant", async () => {
    mockFindOrderById.mockResolvedValue(ORDER);
    await expect(cancelOrder("order-1", "someone-else")).rejects.toThrow(
      NotOrderParticipantError,
    );
  });

  it("voids the Stripe authorization when one exists, for either participant", async () => {
    mockFindOrderById.mockResolvedValue({ ...ORDER, status: "accepted" });
    mockUpdateOrderRow.mockResolvedValue({ ...ORDER, status: "cancelled" });

    await cancelOrder("order-1", "seller-1");

    expect(mockCancelOrderAuthorization).toHaveBeenCalledWith("pi_123", "order-1");
    expect(mockUpdateOrderRow).toHaveBeenCalledWith("order-1", { status: "cancelled" });
  });

  it("skips voiding when no PaymentIntent was ever authorized", async () => {
    mockFindOrderById.mockResolvedValue({ ...ORDER, status: "accepted", stripePaymentIntentId: null });
    mockUpdateOrderRow.mockResolvedValue({ ...ORDER, status: "cancelled" });

    await cancelOrder("order-1", "buyer-1");

    expect(mockCancelOrderAuthorization).not.toHaveBeenCalled();
  });
});

describe("getOrder / getOrderHistoryForBuyer / getOrderHistoryForSeller", () => {
  it("getOrder rejects a non-participant", async () => {
    mockFindOrderById.mockResolvedValue(ORDER);
    await expect(getOrder("order-1", "someone-else")).rejects.toThrow(NotOrderParticipantError);
  });

  it("getOrder returns the order for a participant", async () => {
    mockFindOrderById.mockResolvedValue(ORDER);
    await expect(getOrder("order-1", "buyer-1")).resolves.toEqual(ORDER);
  });

  it("getOrderHistoryForBuyer delegates to the repository", async () => {
    mockListOrdersForBuyer.mockResolvedValue([ORDER]);
    await expect(getOrderHistoryForBuyer("buyer-1")).resolves.toEqual([ORDER]);
    expect(mockListOrdersForBuyer).toHaveBeenCalledWith("buyer-1");
  });

  it("getOrderHistoryForSeller delegates to the repository", async () => {
    mockListOrdersForSeller.mockResolvedValue([ORDER]);
    await expect(getOrderHistoryForSeller("seller-1")).resolves.toEqual([ORDER]);
    expect(mockListOrdersForSeller).toHaveBeenCalledWith("seller-1");
  });
});

describe("handleWebhookEvent (BR-7 idempotency)", () => {
  it("is a no-op for an already-processed event", async () => {
    mockIsEventProcessed.mockResolvedValue(true);
    await handleWebhookEvent({ id: "evt_1", type: "checkout.session.completed" } as never);
    expect(mockUpdateOrderRow).not.toHaveBeenCalled();
  });

  it("checkout.session.completed: records the PaymentIntent id and, for a buy-now order, completes it and marks the listing sold", async () => {
    mockIsEventProcessed.mockResolvedValue(false);
    mockFindOrderById.mockResolvedValue({ ...ORDER, listingId: "listing-1", status: "accepted" });

    await handleWebhookEvent({
      id: "evt_1",
      type: "checkout.session.completed",
      data: {
        object: {
          metadata: { orderId: "order-1" },
          payment_intent: "pi_new",
        },
      },
    } as never);

    expect(mockUpdateOrderRow).toHaveBeenCalledWith("order-1", { stripePaymentIntentId: "pi_new" });
    expect(mockUpdateOrderRow).toHaveBeenCalledWith("order-1", { status: "completed" });
    expect(mockSetListingStatusRow).toHaveBeenCalledWith("listing-1", "sold");
    expect(mockMarkEventProcessed).toHaveBeenCalledWith("evt_1");
  });

  it("checkout.session.completed: does not auto-complete a commission order (no listingId)", async () => {
    mockIsEventProcessed.mockResolvedValue(false);
    mockFindOrderById.mockResolvedValue({ ...ORDER, listingId: null, status: "accepted" });

    await handleWebhookEvent({
      id: "evt_2",
      type: "checkout.session.completed",
      data: {
        object: {
          metadata: { orderId: "order-1" },
          payment_intent: "pi_new",
        },
      },
    } as never);

    expect(mockUpdateOrderRow).toHaveBeenCalledWith("order-1", { stripePaymentIntentId: "pi_new" });
    expect(mockUpdateOrderRow).not.toHaveBeenCalledWith("order-1", { status: "completed" });
    expect(mockSetListingStatusRow).not.toHaveBeenCalled();
  });

  it("payment_intent.succeeded: reconciles a buy-now order to completed", async () => {
    mockIsEventProcessed.mockResolvedValue(false);
    mockFindOrderById.mockResolvedValue({ ...ORDER, listingId: "listing-1", status: "accepted" });

    await handleWebhookEvent({
      id: "evt_3",
      type: "payment_intent.succeeded",
      data: { object: { metadata: { orderId: "order-1" } } },
    } as never);

    expect(mockUpdateOrderRow).toHaveBeenCalledWith("order-1", { status: "completed" });
    expect(mockMarkEventProcessed).toHaveBeenCalledWith("evt_3");
  });

  it("payment_intent.succeeded: is a no-op for a commission order (approveDelivery already handled it)", async () => {
    mockIsEventProcessed.mockResolvedValue(false);
    mockFindOrderById.mockResolvedValue({ ...ORDER, listingId: null, status: "completed" });

    await handleWebhookEvent({
      id: "evt_4",
      type: "payment_intent.succeeded",
      data: { object: { metadata: { orderId: "order-1" } } },
    } as never);

    expect(mockUpdateOrderRow).not.toHaveBeenCalled();
    expect(mockMarkEventProcessed).toHaveBeenCalledWith("evt_4");
  });
});

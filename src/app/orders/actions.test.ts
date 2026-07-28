import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/server/auth/config", () => ({ auth: vi.fn() }));
vi.mock("@/server/orders/service", () => ({
  acceptAndCreateOrder: vi.fn(),
  checkout: vi.fn(),
  getCheckoutUrlForOrder: vi.fn(),
  onboardSellerAction: vi.fn(),
  markInProgress: vi.fn(),
  submitForReview: vi.fn(),
  requestRevision: vi.fn(),
  approveDelivery: vi.fn(),
  cancelOrder: vi.fn(),
  getOrderHistoryForBuyer: vi.fn(),
  getOrderHistoryForSeller: vi.fn(),
}));

import { auth } from "@/server/auth/config";
import {
  acceptAndCreateOrder,
  approveDelivery,
  cancelOrder,
  checkout,
  getCheckoutUrlForOrder,
  getOrderHistoryForBuyer,
  getOrderHistoryForSeller,
  markInProgress,
  onboardSellerAction,
  requestRevision,
  submitForReview,
} from "@/server/orders/service";
import {
  acceptAndCreateOrderAction,
  approveDeliveryAction,
  cancelOrderAction,
  checkoutAction,
  getMyOrdersAsBuyerAction,
  getMyOrdersAsSellerAction,
  markInProgressAction,
  onboardSellerActionAction,
  payOrderAction,
  requestRevisionAction,
  submitForReviewAction,
} from "./actions";

const mockAuth = vi.mocked(auth);
const mockAcceptAndCreateOrder = vi.mocked(acceptAndCreateOrder);
const mockCheckout = vi.mocked(checkout);
const mockApproveDelivery = vi.mocked(approveDelivery);
const mockCancelOrder = vi.mocked(cancelOrder);
const mockGetCheckoutUrlForOrder = vi.mocked(getCheckoutUrlForOrder);
const mockOnboardSellerAction = vi.mocked(onboardSellerAction);
const mockMarkInProgress = vi.mocked(markInProgress);
const mockSubmitForReview = vi.mocked(submitForReview);
const mockRequestRevision = vi.mocked(requestRevision);
const mockGetOrderHistoryForBuyer = vi.mocked(getOrderHistoryForBuyer);
const mockGetOrderHistoryForSeller = vi.mocked(getOrderHistoryForSeller);

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
});

describe("acceptAndCreateOrderAction", () => {
  it("returns the checkout URL on success", async () => {
    mockAcceptAndCreateOrder.mockResolvedValue({
      order: { id: "order-1" } as never,
      checkoutUrl: "https://checkout.stripe.com/cs_1",
    });
    const result = await acceptAndCreateOrderAction("req-1");
    expect(result.checkoutUrl).toBe("https://checkout.stripe.com/cs_1");
    expect(mockAcceptAndCreateOrder).toHaveBeenCalledWith("req-1", "user-1");
  });

  it("surfaces the service's error message (e.g. BR-2 payouts gate)", async () => {
    mockAcceptAndCreateOrder.mockRejectedValue(
      new Error("This shop can't accept payments yet — Stripe onboarding isn't complete."),
    );
    const result = await acceptAndCreateOrderAction("req-1");
    expect(result.formError).toBe(
      "This shop can't accept payments yet — Stripe onboarding isn't complete.",
    );
  });

  it("requires a signed-in caller", async () => {
    mockAuth.mockResolvedValue(null as never);
    const result = await acceptAndCreateOrderAction("req-1");
    expect(result.formError).toBe("Not signed in.");
    expect(mockAcceptAndCreateOrder).not.toHaveBeenCalled();
  });
});

describe("checkoutAction", () => {
  it("calls through with the signed-in buyer id", async () => {
    mockCheckout.mockResolvedValue({
      order: { id: "order-1" } as never,
      checkoutUrl: "https://checkout.stripe.com/cs_2",
    });
    await checkoutAction("listing-1");
    expect(mockCheckout).toHaveBeenCalledWith("listing-1", "user-1");
  });
});

describe("payOrderAction", () => {
  it("returns the regenerated checkout URL for the signed-in buyer", async () => {
    mockGetCheckoutUrlForOrder.mockResolvedValue("https://checkout.stripe.com/cs_3");
    const result = await payOrderAction("order-1");
    expect(mockGetCheckoutUrlForOrder).toHaveBeenCalledWith("order-1", "user-1");
    expect(result.checkoutUrl).toBe("https://checkout.stripe.com/cs_3");
  });

  it("surfaces a rejection for an already-paid order", async () => {
    mockGetCheckoutUrlForOrder.mockRejectedValue(new Error("This order has already been paid for."));
    const result = await payOrderAction("order-1");
    expect(result.formError).toBe("This order has already been paid for.");
  });
});

describe("approveDeliveryAction / cancelOrderAction", () => {
  it("approveDeliveryAction calls through with the signed-in caller", async () => {
    await approveDeliveryAction("order-1");
    expect(mockApproveDelivery).toHaveBeenCalledWith("order-1", "user-1");
  });

  it("cancelOrderAction surfaces a rejection error", async () => {
    mockCancelOrder.mockRejectedValue(new Error("This order can no longer be cancelled."));
    const result = await cancelOrderAction("order-1");
    expect(result.formError).toBe("This order can no longer be cancelled.");
  });

  it("falls back to a generic message for a non-Error rejection", async () => {
    mockCancelOrder.mockRejectedValue("nope");
    const result = await cancelOrderAction("order-1");
    expect(result.formError).toBe("Something went wrong. Please try again.");
  });
});

describe("onboardSellerActionAction", () => {
  it("returns the onboarding URL on success", async () => {
    mockOnboardSellerAction.mockResolvedValue("https://connect.stripe.com/onboard");
    const result = await onboardSellerActionAction("shop-1");
    expect(mockOnboardSellerAction).toHaveBeenCalledWith("shop-1", "user-1");
    expect(result.checkoutUrl).toBe("https://connect.stripe.com/onboard");
    expect(result.success).toBe(true);
  });

  it("surfaces a rejection error", async () => {
    mockOnboardSellerAction.mockRejectedValue(new Error("Shop not found."));
    const result = await onboardSellerActionAction("shop-1");
    expect(result.formError).toBe("Shop not found.");
  });
});

describe("markInProgressAction", () => {
  it("calls through with the signed-in caller", async () => {
    const result = await markInProgressAction("order-1");
    expect(mockMarkInProgress).toHaveBeenCalledWith("order-1", "user-1");
    expect(result.success).toBe(true);
  });

  it("surfaces a rejection error", async () => {
    mockMarkInProgress.mockRejectedValue(new Error("Invalid transition."));
    const result = await markInProgressAction("order-1");
    expect(result.formError).toBe("Invalid transition.");
  });
});

describe("submitForReviewAction", () => {
  it("calls through with the signed-in caller", async () => {
    const result = await submitForReviewAction("order-1");
    expect(mockSubmitForReview).toHaveBeenCalledWith("order-1", "user-1");
    expect(result.success).toBe(true);
  });

  it("surfaces a rejection error", async () => {
    mockSubmitForReview.mockRejectedValue(new Error("Invalid transition."));
    const result = await submitForReviewAction("order-1");
    expect(result.formError).toBe("Invalid transition.");
  });
});

describe("requestRevisionAction", () => {
  it("passes the feedback through", async () => {
    const result = await requestRevisionAction("order-1", "Please add more detail");
    expect(mockRequestRevision).toHaveBeenCalledWith("order-1", "user-1", "Please add more detail");
    expect(result.success).toBe(true);
  });

  it("surfaces a rejection error", async () => {
    mockRequestRevision.mockRejectedValue(new Error("Invalid transition."));
    const result = await requestRevisionAction("order-1", "feedback");
    expect(result.formError).toBe("Invalid transition.");
  });
});

describe("getMyOrdersAsBuyerAction / getMyOrdersAsSellerAction", () => {
  it("returns the buyer's order history for the signed-in user", async () => {
    mockGetOrderHistoryForBuyer.mockResolvedValue([{ id: "order-1" }] as never);
    const result = await getMyOrdersAsBuyerAction();
    expect(mockGetOrderHistoryForBuyer).toHaveBeenCalledWith("user-1");
    expect(result).toEqual([{ id: "order-1" }]);
  });

  it("returns the seller's order history for the signed-in user", async () => {
    mockGetOrderHistoryForSeller.mockResolvedValue([{ id: "order-2" }] as never);
    const result = await getMyOrdersAsSellerAction();
    expect(mockGetOrderHistoryForSeller).toHaveBeenCalledWith("user-1");
    expect(result).toEqual([{ id: "order-2" }]);
  });

  it("rejects when not signed in", async () => {
    mockAuth.mockResolvedValue(null as never);
    await expect(getMyOrdersAsBuyerAction()).rejects.toThrow("Not signed in.");
  });
});

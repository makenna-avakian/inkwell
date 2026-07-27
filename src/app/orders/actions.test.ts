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
} from "@/server/orders/service";
import {
  acceptAndCreateOrderAction,
  approveDeliveryAction,
  cancelOrderAction,
  checkoutAction,
  payOrderAction,
} from "./actions";

const mockAuth = vi.mocked(auth);
const mockAcceptAndCreateOrder = vi.mocked(acceptAndCreateOrder);
const mockCheckout = vi.mocked(checkout);
const mockApproveDelivery = vi.mocked(approveDelivery);
const mockCancelOrder = vi.mocked(cancelOrder);
const mockGetCheckoutUrlForOrder = vi.mocked(getCheckoutUrlForOrder);

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
});

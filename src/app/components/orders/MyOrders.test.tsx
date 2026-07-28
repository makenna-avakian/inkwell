import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/server/orders/service", () => ({
  getOrderHistoryForBuyer: vi.fn(),
}));
vi.mock("@/app/orders/actions", () => ({
  acceptAndCreateOrderAction: vi.fn(),
  approveDeliveryAction: vi.fn(),
  cancelOrderAction: vi.fn(),
  markInProgressAction: vi.fn(),
  payOrderAction: vi.fn(),
  requestRevisionAction: vi.fn(),
  submitForReviewAction: vi.fn(),
}));

import { getOrderHistoryForBuyer } from "@/server/orders/service";
import MyOrders from "./MyOrders";

const mockGetOrderHistoryForBuyer = vi.mocked(getOrderHistoryForBuyer);

const ORDER = {
  id: "order-1",
  requestId: "req-1",
  listingId: null,
  buyerId: "buyer-1",
  sellerId: "seller-1",
  subtotalCents: 10000,
  platformFeeCents: 1000,
  sellerNetCents: 9000,
  status: "accepted" as const,
  stripePaymentIntentId: null,
  stripeTransferId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("MyOrders", () => {
  it("shows an empty state when the buyer has no orders", async () => {
    mockGetOrderHistoryForBuyer.mockResolvedValue([]);

    const jsx = await MyOrders({ buyerId: "buyer-1" });
    render(jsx);

    expect(screen.getByTestId("my-orders-empty")).toBeInTheDocument();
  });

  it("renders a row per order", async () => {
    mockGetOrderHistoryForBuyer.mockResolvedValue([ORDER]);

    const jsx = await MyOrders({ buyerId: "buyer-1" });
    render(jsx);

    expect(screen.getByTestId("my-orders-row-order-1")).toBeInTheDocument();
    expect(screen.getByTestId("order-status-panel")).toBeInTheDocument();
  });
});

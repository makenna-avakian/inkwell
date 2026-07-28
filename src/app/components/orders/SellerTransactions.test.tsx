import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/server/orders/service", () => ({
  getOrderHistoryForSeller: vi.fn(),
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

import { getOrderHistoryForSeller } from "@/server/orders/service";
import SellerTransactions from "./SellerTransactions";

const mockGetOrderHistoryForSeller = vi.mocked(getOrderHistoryForSeller);

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

describe("SellerTransactions", () => {
  it("shows an empty state when the seller has no transactions", async () => {
    mockGetOrderHistoryForSeller.mockResolvedValue([]);

    const jsx = await SellerTransactions({ sellerId: "seller-1" });
    render(jsx);

    expect(screen.getByTestId("seller-transactions-empty")).toBeInTheDocument();
  });

  it("renders the seller net amount per order", async () => {
    mockGetOrderHistoryForSeller.mockResolvedValue([ORDER]);

    const jsx = await SellerTransactions({ sellerId: "seller-1" });
    render(jsx);

    expect(screen.getByTestId("seller-transactions-row-order-1")).toBeInTheDocument();
    expect(screen.getByText("$90.00")).toBeInTheDocument();
  });
});

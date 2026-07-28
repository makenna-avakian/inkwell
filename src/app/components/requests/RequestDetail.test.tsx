import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/server/shops/repository", () => ({
  findShopById: vi.fn(),
}));
vi.mock("@/server/requests/service", () => ({
  getRequestWithMessages: vi.fn(),
  markRequestSeen: vi.fn(),
  postMessageAction: vi.fn(),
}));
vi.mock("@/server/orders/repository", () => ({
  findOrderByRequestId: vi.fn(),
}));
vi.mock("@/app/requests/actions", () => ({
  declineRequestAction: vi.fn(),
  getMessagesAction: vi.fn().mockResolvedValue([]),
  postMessageAction: vi.fn(),
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

import { notFound } from "next/navigation";
import { findShopById } from "@/server/shops/repository";
import { getRequestWithMessages, markRequestSeen } from "@/server/requests/service";
import { findOrderByRequestId } from "@/server/orders/repository";
import RequestDetail from "./RequestDetail";

const mockNotFound = vi.mocked(notFound);
const mockFindShopById = vi.mocked(findShopById);
const mockGetRequestWithMessages = vi.mocked(getRequestWithMessages);
const mockMarkRequestSeen = vi.mocked(markRequestSeen);
const mockFindOrderByRequestId = vi.mocked(findOrderByRequestId);

const REQUEST = {
  id: "req-1",
  shopId: "shop-1",
  buyerId: "buyer-1",
  ruleVersionId: "v1",
  tierId: "t1",
  addOnIds: [],
  description: "A watercolor piece",
  referenceImageUrls: [],
  budgetCents: null,
  deadlinePreference: null,
  status: "requested" as const,
  declineReason: null,
  createdAt: new Date(),
  respondedAt: null,
};

const SHOP = {
  id: "shop-1",
  userId: "seller-1",
  shopName: null,
  bannerImageUrl: null,
  avatarImageUrl: null,
  bio: null,
  socialLinks: [],
  stripeConnectAccountId: null,
  createdAt: new Date(),
};

describe("RequestDetail", () => {
  it("calls notFound() when the request can't be loaded", async () => {
    mockGetRequestWithMessages.mockRejectedValue(new Error("not found"));

    await expect(RequestDetail({ requestId: "req-1", callerId: "buyer-1" })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
    expect(mockNotFound).toHaveBeenCalled();
  });

  it("shows RequestActions for the shop owner when the request is still 'requested'", async () => {
    mockGetRequestWithMessages.mockResolvedValue({ request: REQUEST, messages: [] });
    mockFindShopById.mockResolvedValue(SHOP);
    mockMarkRequestSeen.mockResolvedValue(undefined);

    const jsx = await RequestDetail({ requestId: "req-1", callerId: "seller-1" });
    render(jsx);

    expect(screen.getByTestId("request-actions")).toBeInTheDocument();
  });

  it("does not show RequestActions for the buyer", async () => {
    mockGetRequestWithMessages.mockResolvedValue({ request: REQUEST, messages: [] });
    mockFindShopById.mockResolvedValue(SHOP);
    mockMarkRequestSeen.mockResolvedValue(undefined);

    const jsx = await RequestDetail({ requestId: "req-1", callerId: "buyer-1" });
    render(jsx);

    expect(screen.queryByTestId("request-actions")).not.toBeInTheDocument();
  });

  it("shows the OrderStatusPanel once the request is accepted and an order exists", async () => {
    mockGetRequestWithMessages.mockResolvedValue({
      request: { ...REQUEST, status: "accepted" },
      messages: [],
    });
    mockFindShopById.mockResolvedValue(SHOP);
    mockMarkRequestSeen.mockResolvedValue(undefined);
    mockFindOrderByRequestId.mockResolvedValue({
      id: "order-1",
      requestId: "req-1",
      listingId: null,
      buyerId: "buyer-1",
      sellerId: "seller-1",
      subtotalCents: 10000,
      platformFeeCents: 1000,
      sellerNetCents: 9000,
      status: "accepted",
      stripePaymentIntentId: null,
      stripeTransferId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const jsx = await RequestDetail({ requestId: "req-1", callerId: "buyer-1" });
    render(jsx);

    expect(screen.getByTestId("order-status-panel")).toBeInTheDocument();
  });

  it("shows the budget when set", async () => {
    mockGetRequestWithMessages.mockResolvedValue({
      request: { ...REQUEST, budgetCents: 5000 },
      messages: [],
    });
    mockFindShopById.mockResolvedValue(SHOP);
    mockMarkRequestSeen.mockResolvedValue(undefined);

    const jsx = await RequestDetail({ requestId: "req-1", callerId: "buyer-1" });
    render(jsx);

    expect(screen.getByText("Budget: $50.00")).toBeInTheDocument();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/app/orders/actions", () => ({
  approveDeliveryAction: vi.fn(),
  cancelOrderAction: vi.fn(),
  markInProgressAction: vi.fn(),
  payOrderAction: vi.fn(),
  requestRevisionAction: vi.fn(),
  submitForReviewAction: vi.fn(),
}));

import {
  markInProgressAction,
  payOrderAction,
  submitForReviewAction,
} from "@/app/orders/actions";
import OrderStatusPanel, { type OrderStatusPanelOrder } from "./OrderStatusPanel";

const mockMarkInProgress = vi.mocked(markInProgressAction);
const mockPayOrder = vi.mocked(payOrderAction);
const mockSubmitForReview = vi.mocked(submitForReviewAction);

const BASE_ORDER: OrderStatusPanelOrder = {
  id: "order-1",
  status: "accepted",
  buyerId: "buyer-1",
  sellerId: "seller-1",
  subtotalCents: 10000,
  stripePaymentIntentId: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("OrderStatusPanel", () => {
  it("shows the buyer's Complete Payment button when unpaid, and redirects on click", async () => {
    mockPayOrder.mockResolvedValue({ success: true, checkoutUrl: "https://checkout.stripe.com/cs_1" });
    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, href: "" },
    });

    const user = userEvent.setup();
    render(<OrderStatusPanel order={BASE_ORDER} currentUserId="buyer-1" />);

    expect(screen.getByTestId("order-status-panel-pay-button")).toBeInTheDocument();
    await user.click(screen.getByTestId("order-status-panel-pay-button"));

    await waitFor(() => {
      expect(window.location.href).toBe("https://checkout.stripe.com/cs_1");
    });

    Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
  });

  it("hides the Complete Payment button once paid", () => {
    render(
      <OrderStatusPanel
        order={{ ...BASE_ORDER, stripePaymentIntentId: "pi_123" }}
        currentUserId="buyer-1"
      />,
    );
    expect(screen.queryByTestId("order-status-panel-pay-button")).not.toBeInTheDocument();
  });

  it("shows the seller's Mark In Progress button, not the buyer's controls", () => {
    render(<OrderStatusPanel order={BASE_ORDER} currentUserId="seller-1" />);
    expect(screen.getByTestId("order-status-panel-mark-in-progress-button")).toBeInTheDocument();
    expect(screen.queryByTestId("order-status-panel-pay-button")).not.toBeInTheDocument();
  });

  it("transitions the displayed status after Mark In Progress succeeds", async () => {
    mockMarkInProgress.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    render(<OrderStatusPanel order={BASE_ORDER} currentUserId="seller-1" />);

    await user.click(screen.getByTestId("order-status-panel-mark-in-progress-button"));

    await waitFor(() => {
      expect(screen.getByTestId("order-status-panel-status")).toHaveTextContent("in_progress");
    });
  });

  it("shows Submit for Review for the seller once in_progress", () => {
    render(
      <OrderStatusPanel order={{ ...BASE_ORDER, status: "in_progress" }} currentUserId="seller-1" />,
    );
    expect(screen.getByTestId("order-status-panel-submit-for-review-button")).toBeInTheDocument();
    expect(mockSubmitForReview).not.toHaveBeenCalled();
  });

  it("shows the buyer's Approve Delivery / Request Revision / Cancel controls once delivered", () => {
    render(
      <OrderStatusPanel order={{ ...BASE_ORDER, status: "delivered" }} currentUserId="buyer-1" />,
    );
    expect(screen.getByTestId("order-status-panel-approve-delivery-button")).toBeInTheDocument();
    expect(screen.getByTestId("order-status-panel-request-revision-button")).toBeInTheDocument();
    expect(screen.queryByTestId("order-status-panel-cancel-button")).not.toBeInTheDocument();
  });

  it("shows the Cancel button while cancellable (accepted/in_progress) for either party", () => {
    render(<OrderStatusPanel order={BASE_ORDER} currentUserId="buyer-1" />);
    expect(screen.getByTestId("order-status-panel-cancel-button")).toBeInTheDocument();
  });
});

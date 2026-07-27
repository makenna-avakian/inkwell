import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("@/app/requests/actions", () => ({
  declineRequestAction: vi.fn(),
}));
vi.mock("@/app/orders/actions", () => ({
  acceptAndCreateOrderAction: vi.fn(),
}));

import { declineRequestAction } from "@/app/requests/actions";
import { acceptAndCreateOrderAction } from "@/app/orders/actions";
import RequestActions from "./RequestActions";

const mockAccept = vi.mocked(acceptAndCreateOrderAction);
const mockDecline = vi.mocked(declineRequestAction);

describe("RequestActions", () => {
  it("accepting refreshes the page instead of redirecting (the buyer, not the seller, pays)", async () => {
    mockAccept.mockResolvedValue({ success: true, checkoutUrl: "https://checkout.stripe.com/cs_1" });
    const user = userEvent.setup();
    render(<RequestActions requestId="req-1" />);

    await user.click(screen.getByTestId("request-detail-accept-button"));

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
    expect(screen.queryByTestId("request-actions")).not.toBeInTheDocument();
  });

  it("shows the BR-2 payouts-gate error without hiding the actions", async () => {
    mockAccept.mockResolvedValue({
      formError: "This shop can't accept payments yet — Stripe onboarding isn't complete.",
    });
    const user = userEvent.setup();
    render(<RequestActions requestId="req-1" />);

    await user.click(screen.getByTestId("request-detail-accept-button"));

    await waitFor(() => {
      expect(
        screen.getByText("This shop can't accept payments yet — Stripe onboarding isn't complete."),
      ).toBeInTheDocument();
    });
    expect(screen.getByTestId("request-actions")).toBeInTheDocument();
  });

  it("still supports decline", async () => {
    mockDecline.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    render(<RequestActions requestId="req-1" />);

    await user.click(screen.getByTestId("request-detail-decline-button"));
    await user.type(screen.getByTestId("request-detail-decline-reason-input"), "Not my style");
    await user.click(screen.getByTestId("request-detail-decline-confirm-button"));

    await waitFor(() => {
      expect(mockDecline).toHaveBeenCalledWith("req-1", "Not my style");
    });
  });
});

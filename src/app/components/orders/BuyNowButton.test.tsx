import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/app/orders/actions", () => ({
  checkoutAction: vi.fn(),
}));

import { checkoutAction } from "@/app/orders/actions";
import BuyNowButton from "./BuyNowButton";

const mockCheckout = vi.mocked(checkoutAction);

const originalLocation = window.location;

beforeEach(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...originalLocation, href: "" },
  });
});

afterEach(() => {
  Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
});

describe("BuyNowButton", () => {
  it("redirects to the returned checkout URL on success", async () => {
    mockCheckout.mockResolvedValue({ success: true, checkoutUrl: "https://checkout.stripe.com/cs_1" });
    const user = userEvent.setup();
    render(<BuyNowButton listingId="listing-1" />);

    await user.click(screen.getByTestId("buy-now-submit-button-listing-1"));

    await waitFor(() => {
      expect(window.location.href).toBe("https://checkout.stripe.com/cs_1");
    });
  });

  it("shows an error and re-enables the button on failure", async () => {
    mockCheckout.mockResolvedValue({ formError: "This listing is no longer available." });
    const user = userEvent.setup();
    render(<BuyNowButton listingId="listing-1" />);

    await user.click(screen.getByTestId("buy-now-submit-button-listing-1"));

    await waitFor(() => {
      expect(screen.getByText("This listing is no longer available.")).toBeInTheDocument();
    });
    expect(screen.getByTestId("buy-now-submit-button-listing-1")).not.toBeDisabled();
  });
});

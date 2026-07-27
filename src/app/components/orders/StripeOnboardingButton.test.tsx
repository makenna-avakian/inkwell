import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/app/orders/actions", () => ({
  onboardSellerActionAction: vi.fn(),
}));

import StripeOnboardingButton from "./StripeOnboardingButton";

describe("StripeOnboardingButton", () => {
  it("shows the payouts-enabled message and no button when already connected", () => {
    render(<StripeOnboardingButton shopId="shop-1" payoutsEnabled={true} />);
    expect(screen.getByTestId("stripe-onboarding-status")).toBeInTheDocument();
    expect(screen.queryByTestId("stripe-onboarding-submit-button")).not.toBeInTheDocument();
  });

  it("shows the onboarding button when not yet connected", () => {
    render(<StripeOnboardingButton shopId="shop-1" payoutsEnabled={false} />);
    expect(screen.getByTestId("stripe-onboarding-submit-button")).toBeInTheDocument();
  });
});

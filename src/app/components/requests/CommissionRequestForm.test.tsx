import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/app/requests/actions", () => ({
  submitRequestAction: vi.fn(async () => ({ success: true })),
}));

import { submitRequestAction } from "@/app/requests/actions";
import CommissionRequestForm from "./CommissionRequestForm";

const mockSubmit = vi.mocked(submitRequestAction);

describe("CommissionRequestForm", () => {
  it("renders tier options and shows a success message after submission", async () => {
    const user = userEvent.setup();
    render(
      <CommissionRequestForm
        shopId="shop-1"
        tiers={[{ id: "t1", name: "Sketch", priceCents: 1000 }]}
      />,
    );

    expect(screen.getByText(/Sketch/)).toBeInTheDocument();

    await user.type(
      screen.getByTestId("commission-request-form-description-input"),
      "A pet portrait",
    );
    await user.click(screen.getByTestId("commission-request-form-submit-button"));

    await waitFor(() => {
      expect(screen.getByTestId("commission-request-form-success")).toBeInTheDocument();
    });
    expect(mockSubmit).toHaveBeenCalled();
  });
});

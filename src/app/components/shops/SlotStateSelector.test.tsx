import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/app/(seller)/shop/rules/actions", () => ({
  setSlotStateAction: vi.fn(),
}));

import { setSlotStateAction } from "@/app/(seller)/shop/rules/actions";
import SlotStateSelector from "./SlotStateSelector";

const mockSetSlotState = vi.mocked(setSlotStateAction);

describe("SlotStateSelector", () => {
  it("optimistically switches state and calls the action", async () => {
    mockSetSlotState.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    render(<SlotStateSelector shopId="shop-1" currentState="closed" />);

    await user.click(screen.getByTestId("slot-state-selector-open-option"));

    expect(mockSetSlotState).toHaveBeenCalledWith("shop-1", "open");
    await waitFor(() => {
      expect(screen.getByTestId("slot-state-selector-open-option")).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });
  });

  it("reverts on failure and shows an error", async () => {
    mockSetSlotState.mockResolvedValue({ formError: "You do not have permission to modify this shop." });
    const user = userEvent.setup();
    render(<SlotStateSelector shopId="shop-1" currentState="closed" />);

    await user.click(screen.getByTestId("slot-state-selector-open-option"));

    await waitFor(() => {
      expect(screen.getByTestId("slot-state-selector-closed-option")).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });
    expect(
      screen.getByText("You do not have permission to modify this shop."),
    ).toBeInTheDocument();
  });
});

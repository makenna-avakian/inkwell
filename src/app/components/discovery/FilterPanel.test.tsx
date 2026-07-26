import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));

import FilterPanel from "./FilterPanel";

describe("FilterPanel", () => {
  it("navigates to /gallery with the selected filters as query params", async () => {
    const user = userEvent.setup();
    render(<FilterPanel />);

    await user.type(screen.getByTestId("filter-panel-medium-input"), "Watercolor");
    await user.click(screen.getByTestId("filter-panel-commission-available-checkbox"));
    await user.click(screen.getByTestId("filter-panel-apply-button"));

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringMatching(/^\/gallery\?.*medium=Watercolor.*commissionAvailableOnly=true/),
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));

import FilterPanel from "./FilterPanel";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("FilterPanel", () => {
  it("navigates to /gallery with the selected filters as query params", async () => {
    const user = userEvent.setup();
    render(<FilterPanel availableTags={[]} />);

    await user.type(screen.getByTestId("filter-panel-medium-input"), "Watercolor");
    await user.click(screen.getByTestId("filter-panel-commission-available-checkbox"));
    await user.click(screen.getByTestId("filter-panel-apply-button"));

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringMatching(/^\/gallery\?.*medium=Watercolor.*commissionAvailableOnly=true/),
    );
  });

  it("includes the selected sort option when it's not the default", async () => {
    const user = userEvent.setup();
    render(<FilterPanel availableTags={[]} />);

    await user.selectOptions(screen.getByTestId("filter-panel-sort-select"), "popular");
    await user.click(screen.getByTestId("filter-panel-apply-button"));

    expect(mockPush).toHaveBeenCalledWith(expect.stringMatching(/sort=popular/));
  });

  it("renders a checkbox per available tag and includes checked ones in the query", async () => {
    const user = userEvent.setup();
    render(<FilterPanel availableTags={["Portrait", "Landscape"]} />);

    await user.click(screen.getByTestId("filter-panel-tag-checkbox-Portrait"));
    await user.click(screen.getByTestId("filter-panel-apply-button"));

    expect(mockPush).toHaveBeenCalledWith(expect.stringMatching(/tags=Portrait/));
  });

  it("the Clear button resets to a plain /gallery", async () => {
    const user = userEvent.setup();
    render(<FilterPanel availableTags={[]} />);

    await user.click(screen.getByTestId("filter-panel-clear-button"));

    expect(mockPush).toHaveBeenCalledWith("/gallery");
  });
});

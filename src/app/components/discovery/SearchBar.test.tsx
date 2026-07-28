import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams("q=watercolor"),
}));

import SearchBar from "./SearchBar";

describe("SearchBar", () => {
  it("initializes from the current 'q' query param", () => {
    render(<SearchBar />);
    expect(screen.getByTestId("search-bar-input")).toHaveValue("watercolor");
  });

  it("navigates to /search with the encoded query on submit", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    await user.clear(screen.getByTestId("search-bar-input"));
    await user.type(screen.getByTestId("search-bar-input"), "pet portraits");
    await user.click(screen.getByTestId("search-bar-submit-button"));

    expect(mockPush).toHaveBeenCalledWith("/search?q=pet%20portraits");
  });
});

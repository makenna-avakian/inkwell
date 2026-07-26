import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/server/discovery/service", () => ({
  browseFeed: vi.fn(),
}));

import { browseFeed } from "@/server/discovery/service";
import BrowseFeed from "./BrowseFeed";

const mockBrowseFeed = vi.mocked(browseFeed);

describe("BrowseFeed", () => {
  it("shows an empty-state message when no listings match", async () => {
    mockBrowseFeed.mockResolvedValue({ items: [], page: 1, pageSize: 24, totalCount: 0 });

    const jsx = await BrowseFeed({ filters: { styleTags: [], commissionAvailableOnly: false, page: 1 } });
    render(jsx);

    expect(screen.getByTestId("browse-feed-empty")).toBeInTheDocument();
  });

  it("renders a ListingCard per feed item", async () => {
    mockBrowseFeed.mockResolvedValue({
      items: [
        {
          listingId: "l1",
          title: "House by the Sea",
          priceCents: 5000,
          medium: "Watercolor",
          styleTags: [],
          imageUrl: null,
          shopId: "shop-1",
          shopDisplayName: "Makenna",
          shopSlotState: "open",
        },
      ],
      page: 1,
      pageSize: 24,
      totalCount: 1,
    });

    const jsx = await BrowseFeed({ filters: { styleTags: [], commissionAvailableOnly: false, page: 1 } });
    render(jsx);

    expect(screen.getByTestId("listing-card-l1")).toBeInTheDocument();
  });
});

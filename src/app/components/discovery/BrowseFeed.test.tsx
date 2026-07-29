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

const FILTERS = {
  styleTags: [],
  commissionAvailableOnly: false,
  sort: "newest" as const,
  page: 1,
};

describe("BrowseFeed", () => {
  it("shows an empty-state message when no listings match", async () => {
    mockBrowseFeed.mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 24,
      totalCount: 0,
      availableTags: [],
    });

    const jsx = await BrowseFeed({ filters: FILTERS });
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
          createdAt: new Date("2026-01-01T00:00:00Z"),
          orderCount: 0,
        },
      ],
      page: 1,
      pageSize: 24,
      totalCount: 1,
      availableTags: ["Watercolor"],
    });

    const jsx = await BrowseFeed({ filters: FILTERS });
    render(jsx);

    expect(screen.getByTestId("listing-card-l1")).toBeInTheDocument();
  });

  it("shows the total item count in the heading", async () => {
    mockBrowseFeed.mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 24,
      totalCount: 7,
      availableTags: [],
    });

    const jsx = await BrowseFeed({ filters: FILTERS });
    render(jsx);

    expect(screen.getByText("7 pieces")).toBeInTheDocument();
  });
});

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/server/discovery/service", () => ({
  searchShops: vi.fn(),
}));

import { searchShops } from "@/server/discovery/service";
import ShopSearch from "./ShopSearch";

const mockSearchShops = vi.mocked(searchShops);

describe("ShopSearch", () => {
  it("shows an empty-state message when a query returns no shops", async () => {
    mockSearchShops.mockResolvedValue({ items: [], page: 1, pageSize: 10, totalCount: 0 });

    const jsx = await ShopSearch({ query: "nonexistent", page: 1 });
    render(jsx);

    expect(screen.getByTestId("shop-search-empty")).toBeInTheDocument();
  });

  it("does not show the empty state when the query is blank", async () => {
    mockSearchShops.mockResolvedValue({ items: [], page: 1, pageSize: 10, totalCount: 0 });

    const jsx = await ShopSearch({ query: "", page: 1 });
    render(jsx);

    expect(screen.queryByTestId("shop-search-empty")).not.toBeInTheDocument();
  });

  it("renders a result per shop", async () => {
    mockSearchShops.mockResolvedValue({
      items: [{ shopId: "shop-1", displayName: "Jane's Studio", bio: "Hi", avatarImageUrl: null }],
      page: 1,
      pageSize: 10,
      totalCount: 1,
    });

    const jsx = await ShopSearch({ query: "Jane", page: 1 });
    render(jsx);

    expect(screen.getByTestId("shop-search-result-shop-1")).toBeInTheDocument();
    expect(screen.getByText("Jane's Studio")).toBeInTheDocument();
  });
});

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/server/requests/service", () => ({
  getRequestsForShop: vi.fn(),
  getUnreadSummary: vi.fn(),
}));

import { getRequestsForShop, getUnreadSummary } from "@/server/requests/service";
import RequestInbox from "./RequestInbox";

const mockGetRequestsForShop = vi.mocked(getRequestsForShop);
const mockGetUnreadSummary = vi.mocked(getUnreadSummary);

describe("RequestInbox", () => {
  it("shows an empty state when there are no requests", async () => {
    mockGetRequestsForShop.mockResolvedValue([]);
    mockGetUnreadSummary.mockResolvedValue([]);

    const jsx = await RequestInbox({ shopId: "shop-1", sellerUserId: "seller-1" });
    render(jsx);

    expect(screen.getByTestId("request-inbox-empty")).toBeInTheDocument();
  });

  it("renders a row per request with the unread indicator applied", async () => {
    mockGetRequestsForShop.mockResolvedValue([
      { id: "req-1", description: "A piece", status: "requested" } as never,
    ]);
    mockGetUnreadSummary.mockResolvedValue([{ requestId: "req-1", unread: true }]);

    const jsx = await RequestInbox({ shopId: "shop-1", sellerUserId: "seller-1" });
    render(jsx);

    expect(screen.getByTestId("request-inbox-row-req-1")).toBeInTheDocument();
    expect(screen.getByTestId("status-badge-indicator")).toBeInTheDocument();
  });
});

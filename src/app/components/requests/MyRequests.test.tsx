import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/server/requests/service", () => ({
  getRequestsForBuyer: vi.fn(),
  getUnreadSummary: vi.fn(),
}));

import { getRequestsForBuyer, getUnreadSummary } from "@/server/requests/service";
import MyRequests from "./MyRequests";

const mockGetRequestsForBuyer = vi.mocked(getRequestsForBuyer);
const mockGetUnreadSummary = vi.mocked(getUnreadSummary);

describe("MyRequests", () => {
  it("shows an empty state when the buyer has no requests", async () => {
    mockGetRequestsForBuyer.mockResolvedValue([]);
    mockGetUnreadSummary.mockResolvedValue([]);

    const jsx = await MyRequests({ buyerId: "buyer-1" });
    render(jsx);

    expect(screen.getByTestId("my-requests-empty")).toBeInTheDocument();
  });

  it("renders a row per request", async () => {
    mockGetRequestsForBuyer.mockResolvedValue([
      { id: "req-1", description: "A piece", status: "accepted" } as never,
    ]);
    mockGetUnreadSummary.mockResolvedValue([]);

    const jsx = await MyRequests({ buyerId: "buyer-1" });
    render(jsx);

    expect(screen.getByTestId("my-requests-row-req-1")).toBeInTheDocument();
  });
});

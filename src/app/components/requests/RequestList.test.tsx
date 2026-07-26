import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import RequestList from "./RequestList";

describe("RequestList", () => {
  it("shows an empty-state message when there are no requests", () => {
    render(<RequestList items={[]} detailBasePath="/requests" testIdPrefix="my-requests" />);
    expect(screen.getByTestId("my-requests-empty")).toBeInTheDocument();
  });

  it("shows an unread indicator for unread items only", () => {
    render(
      <RequestList
        items={[
          { id: "r1", description: "Piece 1", status: "requested", unread: true },
          { id: "r2", description: "Piece 2", status: "accepted", unread: false },
        ]}
        detailBasePath="/requests"
        testIdPrefix="my-requests"
      />,
    );
    expect(
      screen.getByTestId("my-requests-row-r1").querySelector('[data-testid="status-badge-indicator"]'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("my-requests-row-r2").querySelector('[data-testid="status-badge-indicator"]'),
    ).not.toBeInTheDocument();
  });
});

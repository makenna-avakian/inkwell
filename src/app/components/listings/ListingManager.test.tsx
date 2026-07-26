import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/app/(seller)/shop/listings/actions", () => ({
  createListingAction: vi.fn(async () => ({ fieldErrors: {} })),
}));

import ListingManager from "./ListingManager";

describe("ListingManager", () => {
  it("renders existing listings with price formatted as dollars", () => {
    render(
      <ListingManager
        shopId="shop-1"
        initialListings={[
          { id: "l1", title: "House by the Sea", priceCents: 12345, status: "available" },
        ]}
      />,
    );
    expect(screen.getByText(/House by the Sea/)).toBeInTheDocument();
    expect(screen.getByText(/\$123\.45/)).toBeInTheDocument();
  });

  it("renders the create-listing form", async () => {
    const user = userEvent.setup();
    render(<ListingManager shopId="shop-1" initialListings={[]} />);

    await user.type(screen.getByTestId("listing-manager-title-input"), "New piece");
    await user.type(screen.getByTestId("listing-manager-price-input"), "10");
    await user.click(screen.getByTestId("listing-manager-create-button"));
  });
});

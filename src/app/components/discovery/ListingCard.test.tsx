import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ListingCard from "./ListingCard";

const BASE_PROPS = {
  listingId: "l1",
  title: "Moth Queen",
  priceCents: 18000,
  imageUrl: null,
  styleTags: ["Portrait", "Illustration", "Fan Art", "Extra Tag"],
  shopId: "shop-1",
  shopDisplayName: "Reya Lin",
  shopSlotState: "open" as const,
};

describe("ListingCard", () => {
  it("renders the title, formatted price, and shop name", () => {
    render(<ListingCard {...BASE_PROPS} />);

    expect(screen.getByText("Moth Queen")).toBeInTheDocument();
    expect(screen.getByText("$180.00")).toBeInTheDocument();
    expect(screen.getByText("Reya Lin")).toBeInTheDocument();
  });

  it("shows at most 3 style tag chips", () => {
    render(<ListingCard {...BASE_PROPS} />);

    expect(screen.getByText("Portrait")).toBeInTheDocument();
    expect(screen.getByText("Illustration")).toBeInTheDocument();
    expect(screen.getByText("Fan Art")).toBeInTheDocument();
    expect(screen.queryByText("Extra Tag")).not.toBeInTheDocument();
  });

  it("shows the open-for-commission badge when the shop is open or waitlisted", () => {
    render(<ListingCard {...BASE_PROPS} shopSlotState="waitlist" />);
    expect(screen.getByTestId("listing-card-open-badge")).toBeInTheDocument();
  });

  it("hides the open-for-commission badge when the shop is closed", () => {
    render(<ListingCard {...BASE_PROPS} shopSlotState="closed" />);
    expect(screen.queryByTestId("listing-card-open-badge")).not.toBeInTheDocument();
  });

  it("derives initials from the shop display name", () => {
    render(<ListingCard {...BASE_PROPS} shopDisplayName="Jane's Watercolor Studio" />);
    expect(screen.getByText("JW")).toBeInTheDocument();
  });

  it("links to the shop page", () => {
    render(<ListingCard {...BASE_PROPS} />);
    expect(screen.getByTestId("listing-card-l1")).toHaveAttribute("href", "/shops/shop-1");
  });
});

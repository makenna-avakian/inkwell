import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PortfolioGallery, { type PortfolioGalleryImage } from "./PortfolioGallery";

function makeImage(overrides: Partial<PortfolioGalleryImage> = {}): PortfolioGalleryImage {
  return {
    id: "img-1",
    imageUrl: "https://media/1.png",
    title: null,
    caption: null,
    tags: [],
    listingId: null,
    featured: false,
    ...overrides,
  };
}

describe("PortfolioGallery", () => {
  it("shows the empty state when there are no images", () => {
    render(<PortfolioGallery images={[]} availableListingIds={[]} />);
    expect(screen.getByTestId("portfolio-gallery-empty")).toBeInTheDocument();
  });

  it("renders a thumbnail per image and no lightbox until clicked", () => {
    render(<PortfolioGallery images={[makeImage()]} availableListingIds={[]} />);
    expect(screen.getByTestId("portfolio-gallery-thumb-img-1")).toBeInTheDocument();
    expect(screen.queryByTestId("portfolio-gallery-lightbox")).not.toBeInTheDocument();
  });

  it("opens a lightbox with title/caption/tags on click", async () => {
    const user = userEvent.setup();
    render(
      <PortfolioGallery
        images={[makeImage({ title: "Autumn Study", caption: "Gouache", tags: ["watercolor", "fall"] })]}
        availableListingIds={[]}
      />,
    );

    await user.click(screen.getByTestId("portfolio-gallery-thumb-img-1"));

    const lightbox = within(screen.getByTestId("portfolio-gallery-lightbox"));
    expect(lightbox.getByText("Autumn Study")).toBeInTheDocument();
    expect(lightbox.getByText("Gouache")).toBeInTheDocument();
    expect(lightbox.getByText("watercolor · fall")).toBeInTheDocument();
  });

  it("closes the lightbox via the close button", async () => {
    const user = userEvent.setup();
    render(<PortfolioGallery images={[makeImage()]} availableListingIds={[]} />);

    await user.click(screen.getByTestId("portfolio-gallery-thumb-img-1"));
    expect(screen.getByTestId("portfolio-gallery-lightbox")).toBeInTheDocument();

    await user.click(screen.getByTestId("portfolio-gallery-lightbox-close"));
    expect(screen.queryByTestId("portfolio-gallery-lightbox")).not.toBeInTheDocument();
  });

  it("closes the lightbox on Escape", async () => {
    const user = userEvent.setup();
    render(<PortfolioGallery images={[makeImage()]} availableListingIds={[]} />);

    await user.click(screen.getByTestId("portfolio-gallery-thumb-img-1"));
    expect(screen.getByTestId("portfolio-gallery-lightbox")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("portfolio-gallery-lightbox")).not.toBeInTheDocument();
  });

  it("shows an 'Available now' link only when the linked listing is currently available", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <PortfolioGallery images={[makeImage({ listingId: "listing-1" })]} availableListingIds={[]} />,
    );

    await user.click(screen.getByTestId("portfolio-gallery-thumb-img-1"));
    expect(screen.queryByTestId("portfolio-gallery-lightbox-listing-link")).not.toBeInTheDocument();
    await user.click(screen.getByTestId("portfolio-gallery-lightbox-close"));

    rerender(
      <PortfolioGallery
        images={[makeImage({ listingId: "listing-1" })]}
        availableListingIds={["listing-1"]}
      />,
    );
    await user.click(screen.getByTestId("portfolio-gallery-thumb-img-1"));
    expect(screen.getByTestId("portfolio-gallery-lightbox-listing-link")).toHaveAttribute(
      "href",
      "#listing-listing-1",
    );
  });

  it("gives the featured piece a larger grid span", () => {
    render(<PortfolioGallery images={[makeImage({ featured: true })]} availableListingIds={[]} />);
    expect(screen.getByTestId("portfolio-gallery-thumb-img-1").className).toContain("col-span-2");
  });
});

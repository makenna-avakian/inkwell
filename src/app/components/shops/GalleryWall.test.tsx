import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/app/shops/[shopId]/gallery/actions", () => ({
  saveGalleryWallLayoutAction: vi.fn(),
}));

import { saveGalleryWallLayoutAction } from "@/app/shops/[shopId]/gallery/actions";
import GalleryWall, { type GalleryWallPoolPiece } from "./GalleryWall";

const mockSaveLayout = vi.mocked(saveGalleryWallLayoutAction);

const POOL: GalleryWallPoolPiece[] = [
  { id: "piece-1", imageUrl: "https://x/1.png", title: "Moth Queen", listingId: null, priceCents: null },
  { id: "piece-2", imageUrl: "https://x/2.png", title: "Harbor Light", listingId: "l1", priceCents: 34000 },
  { id: "piece-3", imageUrl: "https://x/3.png", title: "Pixel Garden", listingId: null, priceCents: null },
  { id: "piece-4", imageUrl: "https://x/4.png", title: "Ash & Ember", listingId: null, priceCents: null },
  { id: "piece-5", imageUrl: "https://x/5.png", title: "Cloudwalker", listingId: null, priceCents: null },
  { id: "piece-6", imageUrl: "https://x/6.png", title: "Neon Alley", listingId: null, priceCents: null },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockSaveLayout.mockResolvedValue({});
});

describe("GalleryWall — edit mode", () => {
  it("selects pieces up to the cap of 5 and disables further selection", async () => {
    const user = userEvent.setup();
    render(
      <GalleryWall
        shopId="shop-1"
        shopDisplayName="Jane's Studio"
        pool={POOL}
        initialSettings={null}
        canEdit
      />,
    );

    // Three pieces are pre-selected by default (piece-1/2/3); add two more to hit the cap.
    await user.click(screen.getByTestId("gallery-wall-pool-item-piece-4"));
    await user.click(screen.getByTestId("gallery-wall-pool-item-piece-5"));

    await waitFor(() => {
      expect(screen.getByTestId("gallery-wall-frame-piece-5")).toBeInTheDocument();
    });

    // A 6th piece is now over the cap — clicking it should not add a 6th frame.
    await user.click(screen.getByTestId("gallery-wall-pool-item-piece-6"));
    expect(screen.queryByTestId("gallery-wall-frame-piece-6")).not.toBeInTheDocument();
  });

  it("deselecting a piece removes its frame and saves the new selection", async () => {
    const user = userEvent.setup();
    render(
      <GalleryWall
        shopId="shop-1"
        shopDisplayName="Jane's Studio"
        pool={POOL}
        initialSettings={null}
        canEdit
      />,
    );

    await user.click(screen.getByTestId("gallery-wall-pool-item-piece-1"));

    await waitFor(() => {
      expect(screen.queryByTestId("gallery-wall-frame-piece-1")).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(mockSaveLayout).toHaveBeenCalledWith(
        "shop-1",
        expect.objectContaining({
          pieces: expect.arrayContaining([
            expect.objectContaining({ portfolioImageId: "piece-2" }),
            expect.objectContaining({ portfolioImageId: "piece-3" }),
          ]),
        }),
      );
    });
  });

  it("changes frame color and saves it", async () => {
    const user = userEvent.setup();
    render(
      <GalleryWall
        shopId="shop-1"
        shopDisplayName="Jane's Studio"
        pool={POOL}
        initialSettings={null}
        canEdit
      />,
    );

    await user.click(screen.getByTestId("gallery-wall-frame-color-gold"));

    await waitFor(() => {
      expect(mockSaveLayout).toHaveBeenCalledWith(
        "shop-1",
        expect.objectContaining({ frameColor: "gold" }),
      );
    });
  });

  it("changes frame style and saves it", async () => {
    const user = userEvent.setup();
    render(
      <GalleryWall
        shopId="shop-1"
        shopDisplayName="Jane's Studio"
        pool={POOL}
        initialSettings={null}
        canEdit
      />,
    );

    await user.click(screen.getByTestId("gallery-wall-frame-style-floating"));

    await waitFor(() => {
      expect(mockSaveLayout).toHaveBeenCalledWith(
        "shop-1",
        expect.objectContaining({ frameStyle: "floating" }),
      );
    });
  });

  it("shows an error banner when saving fails", async () => {
    mockSaveLayout.mockResolvedValue({ error: "Couldn't save the gallery wall. Please try again." });
    const user = userEvent.setup();
    render(
      <GalleryWall
        shopId="shop-1"
        shopDisplayName="Jane's Studio"
        pool={POOL}
        initialSettings={null}
        canEdit
      />,
    );

    await user.click(screen.getByTestId("gallery-wall-frame-color-gold"));

    await waitFor(() => {
      expect(screen.getByTestId("gallery-wall-error")).toHaveTextContent(
        "Couldn't save the gallery wall. Please try again.",
      );
    });
  });

  it("toggles between edit and preview mode", async () => {
    const user = userEvent.setup();
    render(
      <GalleryWall
        shopId="shop-1"
        shopDisplayName="Jane's Studio"
        pool={POOL}
        initialSettings={null}
        canEdit
      />,
    );

    expect(screen.getByTestId("gallery-wall-pool-item-piece-1")).toBeInTheDocument();
    await user.click(screen.getByTestId("gallery-wall-mode-toggle"));
    expect(screen.queryByTestId("gallery-wall-pool-item-piece-1")).not.toBeInTheDocument();
  });

  it("shows an empty-portfolio message when there are no pieces to choose from", () => {
    render(
      <GalleryWall shopId="shop-1" shopDisplayName="Jane's Studio" pool={[]} initialSettings={null} canEdit />,
    );

    expect(
      screen.getByText(/Add some pieces to your portfolio first/),
    ).toBeInTheDocument();
  });
});

describe("GalleryWall — view mode (non-owner)", () => {
  it("hides all edit chrome for a non-owner", () => {
    render(
      <GalleryWall
        shopId="shop-1"
        shopDisplayName="Jane's Studio"
        pool={POOL}
        initialSettings={{
          frameColor: "black",
          frameStyle: "classic",
          pieces: [{ portfolioImageId: "piece-1", x: 50, y: 15 }],
        }}
        canEdit={false}
      />,
    );

    expect(screen.queryByTestId("gallery-wall-mode-toggle")).not.toBeInTheDocument();
    expect(screen.queryByTestId("gallery-wall-pool-item-piece-1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("gallery-wall-frame-color-gold")).not.toBeInTheDocument();
    expect(screen.getByTestId("gallery-wall-frame-piece-1")).toBeInTheDocument();
  });

  it("shows a placeholder message when nothing has been placed yet", () => {
    render(
      <GalleryWall shopId="shop-1" shopDisplayName="Jane's Studio" pool={POOL} initialSettings={null} canEdit={false} />,
    );

    expect(screen.getByText("This shop hasn't set up a gallery wall yet.")).toBeInTheDocument();
  });
});

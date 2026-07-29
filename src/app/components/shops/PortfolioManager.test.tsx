import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/app/(seller)/shop/actions", () => ({
  requestPortfolioUploadUrlAction: vi.fn(),
  confirmPortfolioImageAction: vi.fn(),
  updatePortfolioImageAction: vi.fn(),
  deletePortfolioImageAction: vi.fn(),
  reorderPortfolioImagesAction: vi.fn(),
  setFeaturedPortfolioImageAction: vi.fn(),
}));

import {
  confirmPortfolioImageAction,
  deletePortfolioImageAction,
  reorderPortfolioImagesAction,
  requestPortfolioUploadUrlAction,
  setFeaturedPortfolioImageAction,
  updatePortfolioImageAction,
} from "@/app/(seller)/shop/actions";
import PortfolioManager, { type PortfolioImage } from "./PortfolioManager";

const mockRequestUpload = vi.mocked(requestPortfolioUploadUrlAction);
const mockConfirmImage = vi.mocked(confirmPortfolioImageAction);
const mockUpdateImage = vi.mocked(updatePortfolioImageAction);
const mockDeleteImage = vi.mocked(deletePortfolioImageAction);
const mockReorderImages = vi.mocked(reorderPortfolioImagesAction);
const mockSetFeatured = vi.mocked(setFeaturedPortfolioImageAction);

const originalFetch = global.fetch;

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn().mockResolvedValue({ ok: true });
});

afterEach(() => {
  global.fetch = originalFetch;
});

function makeFile() {
  return new File(["x"], "piece.png", { type: "image/png" });
}

function makeImage(overrides: Partial<PortfolioImage> = {}): PortfolioImage {
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

describe("PortfolioManager", () => {
  it("renders existing images with title/caption/tags", () => {
    render(
      <PortfolioManager
        shopId="shop-1"
        initialImages={[
          makeImage({ title: "Autumn Study", caption: "Gouache", tags: ["watercolor", "landscape"] }),
        ]}
        listingOptions={[]}
      />,
    );
    expect(screen.getByTestId("portfolio-manager")).toBeInTheDocument();
    expect(screen.getByText("Autumn Study")).toBeInTheDocument();
    expect(screen.getByText("Gouache")).toBeInTheDocument();
    expect(screen.getByText("watercolor · landscape")).toBeInTheDocument();
  });

  it("shows Untitled for a piece with no title", () => {
    render(<PortfolioManager shopId="shop-1" initialImages={[makeImage()]} listingOptions={[]} />);
    expect(screen.getByText("Untitled")).toBeInTheDocument();
  });

  it("shows a Featured badge and no Feature button for the featured piece", () => {
    render(
      <PortfolioManager
        shopId="shop-1"
        initialImages={[makeImage({ featured: true })]}
        listingOptions={[]}
      />,
    );
    expect(screen.getByTestId("portfolio-piece-img-1-featured-badge")).toBeInTheDocument();
    expect(screen.queryByTestId("portfolio-piece-img-1-feature-button")).not.toBeInTheDocument();
  });

  it("uploads a new image and appends it to the grid", async () => {
    mockRequestUpload.mockResolvedValue({
      uploadUrl: "https://r2/upload",
      imageUrl: "https://media.inkwell.app/prod/piece.png",
    });
    mockConfirmImage.mockResolvedValue({ id: "img-new" });
    const user = userEvent.setup();

    render(<PortfolioManager shopId="shop-1" initialImages={[]} listingOptions={[]} />);
    await user.upload(screen.getByTestId("portfolio-manager-file-input"), makeFile());

    await waitFor(() => {
      expect(mockConfirmImage).toHaveBeenCalledWith(
        "shop-1",
        "https://media.inkwell.app/prod/piece.png",
      );
    });
    await waitFor(() => {
      expect(screen.getByTestId("portfolio-piece-img-new")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("portfolio-manager-error")).not.toBeInTheDocument();
  });

  it("shows an error when the upload URL request fails", async () => {
    mockRequestUpload.mockResolvedValue({ error: "Unsupported image type." });
    const user = userEvent.setup();

    render(<PortfolioManager shopId="shop-1" initialImages={[]} listingOptions={[]} />);
    await user.upload(screen.getByTestId("portfolio-manager-file-input"), makeFile());

    await waitFor(() => {
      expect(screen.getByTestId("portfolio-manager-error")).toHaveTextContent(
        "Unsupported image type.",
      );
    });
    expect(mockConfirmImage).not.toHaveBeenCalled();
  });

  it("shows an error when the upload itself fails (non-2xx response)", async () => {
    mockRequestUpload.mockResolvedValue({
      uploadUrl: "https://r2/upload",
      imageUrl: "https://media.inkwell.app/prod/piece.png",
    });
    global.fetch = vi.fn().mockResolvedValue({ ok: false });
    const user = userEvent.setup();

    render(<PortfolioManager shopId="shop-1" initialImages={[]} listingOptions={[]} />);
    await user.upload(screen.getByTestId("portfolio-manager-file-input"), makeFile());

    await waitFor(() => {
      expect(screen.getByTestId("portfolio-manager-error")).toHaveTextContent(
        "Upload failed. Please try again.",
      );
    });
    expect(mockConfirmImage).not.toHaveBeenCalled();
  });

  it("shows a CORS-specific error when the upload request fails at the network level", async () => {
    mockRequestUpload.mockResolvedValue({
      uploadUrl: "https://r2/upload",
      imageUrl: "https://media.inkwell.app/prod/piece.png",
    });
    global.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    const user = userEvent.setup();

    render(<PortfolioManager shopId="shop-1" initialImages={[]} listingOptions={[]} />);
    await user.upload(screen.getByTestId("portfolio-manager-file-input"), makeFile());

    await waitFor(() => {
      expect(screen.getByTestId("portfolio-manager-error")).toHaveTextContent(
        "the storage service rejected the request",
      );
    });
  });

  it("shows an error when confirming the image fails", async () => {
    mockRequestUpload.mockResolvedValue({
      uploadUrl: "https://r2/upload",
      imageUrl: "https://media.inkwell.app/prod/piece.png",
    });
    mockConfirmImage.mockResolvedValue({ error: "Couldn't save the image." });
    const user = userEvent.setup();

    render(<PortfolioManager shopId="shop-1" initialImages={[]} listingOptions={[]} />);
    await user.upload(screen.getByTestId("portfolio-manager-file-input"), makeFile());

    await waitFor(() => {
      expect(screen.getByTestId("portfolio-manager-error")).toHaveTextContent(
        "Couldn't save the image.",
      );
    });
  });

  it("edits title/caption/tags and links a listing, then saves", async () => {
    mockUpdateImage.mockResolvedValue({});
    const user = userEvent.setup();

    render(
      <PortfolioManager
        shopId="shop-1"
        initialImages={[makeImage()]}
        listingOptions={[{ id: "listing-1", title: "Autumn Study Print" }]}
      />,
    );

    await user.click(screen.getByTestId("portfolio-piece-img-1-edit-button"));
    await user.type(screen.getByTestId("portfolio-piece-img-1-title-input"), "Autumn Study");
    await user.type(screen.getByTestId("portfolio-piece-img-1-caption-input"), "Gouache on paper");
    await user.type(screen.getByTestId("portfolio-piece-img-1-tags-input"), "watercolor, landscape");
    await user.selectOptions(screen.getByTestId("portfolio-piece-img-1-listing-select"), "listing-1");
    await user.click(screen.getByTestId("portfolio-piece-img-1-save-button"));

    await waitFor(() => {
      expect(mockUpdateImage).toHaveBeenCalledWith("shop-1", "img-1", {
        title: "Autumn Study",
        caption: "Gouache on paper",
        tags: ["watercolor", "landscape"],
        listingId: "listing-1",
      });
    });
    await waitFor(() => {
      expect(screen.getByText("Autumn Study")).toBeInTheDocument();
    });
  });

  it("shows an error and stays in edit mode when saving fails", async () => {
    mockUpdateImage.mockResolvedValue({ error: "Title too long." });
    const user = userEvent.setup();

    render(<PortfolioManager shopId="shop-1" initialImages={[makeImage()]} listingOptions={[]} />);
    await user.click(screen.getByTestId("portfolio-piece-img-1-edit-button"));
    await user.click(screen.getByTestId("portfolio-piece-img-1-save-button"));

    await waitFor(() => {
      expect(screen.getByTestId("portfolio-manager-error")).toHaveTextContent("Title too long.");
    });
    expect(screen.getByTestId("portfolio-piece-img-1-title-input")).toBeInTheDocument();
  });

  it("cancels editing without saving", async () => {
    const user = userEvent.setup();
    render(<PortfolioManager shopId="shop-1" initialImages={[makeImage()]} listingOptions={[]} />);

    await user.click(screen.getByTestId("portfolio-piece-img-1-edit-button"));
    await user.type(screen.getByTestId("portfolio-piece-img-1-title-input"), "Draft title");
    await user.click(screen.getByText("Cancel"));

    expect(screen.queryByTestId("portfolio-piece-img-1-title-input")).not.toBeInTheDocument();
    expect(mockUpdateImage).not.toHaveBeenCalled();
  });

  it("deletes a piece", async () => {
    mockDeleteImage.mockResolvedValue({});
    const user = userEvent.setup();

    render(<PortfolioManager shopId="shop-1" initialImages={[makeImage()]} listingOptions={[]} />);
    await user.click(screen.getByTestId("portfolio-piece-img-1-delete-button"));

    await waitFor(() => {
      expect(mockDeleteImage).toHaveBeenCalledWith("shop-1", "img-1");
    });
    expect(screen.queryByTestId("portfolio-piece-img-1")).not.toBeInTheDocument();
  });

  it("shows an error when delete fails and keeps the piece", async () => {
    mockDeleteImage.mockResolvedValue({ error: "Nope." });
    const user = userEvent.setup();

    render(<PortfolioManager shopId="shop-1" initialImages={[makeImage()]} listingOptions={[]} />);
    await user.click(screen.getByTestId("portfolio-piece-img-1-delete-button"));

    await waitFor(() => {
      expect(screen.getByTestId("portfolio-manager-error")).toHaveTextContent("Nope.");
    });
    expect(screen.getByTestId("portfolio-piece-img-1")).toBeInTheDocument();
  });

  it("features a piece", async () => {
    mockSetFeatured.mockResolvedValue({});
    const user = userEvent.setup();

    render(<PortfolioManager shopId="shop-1" initialImages={[makeImage()]} listingOptions={[]} />);
    await user.click(screen.getByTestId("portfolio-piece-img-1-feature-button"));

    await waitFor(() => {
      expect(mockSetFeatured).toHaveBeenCalledWith("shop-1", "img-1");
    });
    await waitFor(() => {
      expect(screen.getByTestId("portfolio-piece-img-1-featured-badge")).toBeInTheDocument();
    });
  });

  it("reorders pieces with the move up/down buttons", async () => {
    mockReorderImages.mockResolvedValue({});
    const user = userEvent.setup();

    render(
      <PortfolioManager
        shopId="shop-1"
        initialImages={[makeImage({ id: "img-1" }), makeImage({ id: "img-2" })]}
        listingOptions={[]}
      />,
    );

    expect(screen.getByTestId("portfolio-piece-img-1-move-up-button")).toBeDisabled();
    await user.click(screen.getByTestId("portfolio-piece-img-2-move-up-button"));

    await waitFor(() => {
      expect(mockReorderImages).toHaveBeenCalledWith("shop-1", ["img-2", "img-1"]);
    });
  });
});

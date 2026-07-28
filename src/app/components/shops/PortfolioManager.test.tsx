import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/app/(seller)/shop/actions", () => ({
  requestPortfolioUploadUrlAction: vi.fn(),
  confirmPortfolioImageAction: vi.fn(),
}));

import {
  confirmPortfolioImageAction,
  requestPortfolioUploadUrlAction,
} from "@/app/(seller)/shop/actions";
import PortfolioManager from "./PortfolioManager";

const mockRequestUpload = vi.mocked(requestPortfolioUploadUrlAction);
const mockConfirmImage = vi.mocked(confirmPortfolioImageAction);

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

describe("PortfolioManager", () => {
  it("renders existing images", () => {
    render(
      <PortfolioManager
        shopId="shop-1"
        initialImages={[{ id: "img-1", imageUrl: "https://media/1.png" }]}
      />,
    );
    expect(screen.getByTestId("portfolio-manager")).toBeInTheDocument();
  });

  it("uploads a new image and appends it to the grid", async () => {
    mockRequestUpload.mockResolvedValue({
      uploadUrl: "https://r2/upload",
      imageUrl: "https://media.inkwell.app/prod/piece.png",
    });
    mockConfirmImage.mockResolvedValue({});
    const user = userEvent.setup();

    render(<PortfolioManager shopId="shop-1" initialImages={[]} />);
    await user.upload(screen.getByTestId("portfolio-manager-file-input"), makeFile());

    await waitFor(() => {
      expect(mockConfirmImage).toHaveBeenCalledWith(
        "shop-1",
        "https://media.inkwell.app/prod/piece.png",
      );
    });
    expect(screen.queryByTestId("portfolio-manager-error")).not.toBeInTheDocument();
  });

  it("shows an error when the upload URL request fails", async () => {
    mockRequestUpload.mockResolvedValue({ error: "Unsupported image type." });
    const user = userEvent.setup();

    render(<PortfolioManager shopId="shop-1" initialImages={[]} />);
    await user.upload(screen.getByTestId("portfolio-manager-file-input"), makeFile());

    await waitFor(() => {
      expect(screen.getByTestId("portfolio-manager-error")).toHaveTextContent(
        "Unsupported image type.",
      );
    });
    expect(mockConfirmImage).not.toHaveBeenCalled();
  });

  it("shows an error when the PUT upload itself fails", async () => {
    mockRequestUpload.mockResolvedValue({
      uploadUrl: "https://r2/upload",
      imageUrl: "https://media.inkwell.app/prod/piece.png",
    });
    global.fetch = vi.fn().mockResolvedValue({ ok: false });
    const user = userEvent.setup();

    render(<PortfolioManager shopId="shop-1" initialImages={[]} />);
    await user.upload(screen.getByTestId("portfolio-manager-file-input"), makeFile());

    await waitFor(() => {
      expect(screen.getByTestId("portfolio-manager-error")).toHaveTextContent(
        "Upload failed. Please try again.",
      );
    });
    expect(mockConfirmImage).not.toHaveBeenCalled();
  });

  it("shows an error when confirming the image fails", async () => {
    mockRequestUpload.mockResolvedValue({
      uploadUrl: "https://r2/upload",
      imageUrl: "https://media.inkwell.app/prod/piece.png",
    });
    mockConfirmImage.mockResolvedValue({ error: "Couldn't save the image." });
    const user = userEvent.setup();

    render(<PortfolioManager shopId="shop-1" initialImages={[]} />);
    await user.upload(screen.getByTestId("portfolio-manager-file-input"), makeFile());

    await waitFor(() => {
      expect(screen.getByTestId("portfolio-manager-error")).toHaveTextContent(
        "Couldn't save the image.",
      );
    });
  });
});

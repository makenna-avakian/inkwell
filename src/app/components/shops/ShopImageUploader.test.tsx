import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ShopImageUploader from "./ShopImageUploader";

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({ ok: true });
});

afterEach(() => {
  global.fetch = originalFetch;
});

function makeFile() {
  return new File(["x"], "banner.png", { type: "image/png" });
}

describe("ShopImageUploader", () => {
  it("uploads a file and shows the new preview on success", async () => {
    const requestUploadUrlAction = vi.fn().mockResolvedValue({
      uploadUrl: "https://r2/upload",
      uploadFields: { key: "prod/banner.png", "Content-Type": "image/png" },
      imageUrl: "https://media.inkwell.app/prod/banner.png",
    });
    const confirmImageAction = vi.fn().mockResolvedValue({});
    const user = userEvent.setup();

    render(
      <ShopImageUploader
        shopId="shop-1"
        label="Background image"
        initialImageUrl={null}
        previewClassName="h-32 w-full object-cover"
        testIdPrefix="shop-banner-uploader"
        requestUploadUrlAction={requestUploadUrlAction}
        confirmImageAction={confirmImageAction}
      />,
    );

    expect(screen.queryByTestId("shop-banner-uploader-preview")).not.toBeInTheDocument();

    const input = screen.getByTestId("shop-banner-uploader-file-input");
    await user.upload(input, makeFile());

    await waitFor(() => {
      expect(screen.getByTestId("shop-banner-uploader-preview")).toBeInTheDocument();
    });
    expect(requestUploadUrlAction).toHaveBeenCalledWith("shop-1", "banner.png", "image/png", 1);
    expect(confirmImageAction).toHaveBeenCalledWith(
      "shop-1",
      "https://media.inkwell.app/prod/banner.png",
    );
  });

  it("shows an error and no preview when the upload URL request fails", async () => {
    const requestUploadUrlAction = vi.fn().mockResolvedValue({ error: "Unsupported image type." });
    const confirmImageAction = vi.fn();
    const user = userEvent.setup();

    render(
      <ShopImageUploader
        shopId="shop-1"
        label="Avatar"
        initialImageUrl={null}
        previewClassName="h-20 w-20 rounded-full object-cover"
        testIdPrefix="shop-avatar-uploader"
        requestUploadUrlAction={requestUploadUrlAction}
        confirmImageAction={confirmImageAction}
      />,
    );

    await user.upload(screen.getByTestId("shop-avatar-uploader-file-input"), makeFile());

    await waitFor(() => {
      expect(screen.getByTestId("shop-avatar-uploader-error")).toHaveTextContent(
        "Unsupported image type.",
      );
    });
    expect(confirmImageAction).not.toHaveBeenCalled();
    expect(screen.queryByTestId("shop-avatar-uploader-preview")).not.toBeInTheDocument();
  });

  it("renders the initial image as a preview when provided", () => {
    render(
      <ShopImageUploader
        shopId="shop-1"
        label="Avatar"
        initialImageUrl="https://media.inkwell.app/prod/avatar.png"
        previewClassName="h-20 w-20 rounded-full object-cover"
        testIdPrefix="shop-avatar-uploader"
        requestUploadUrlAction={vi.fn()}
        confirmImageAction={vi.fn()}
      />,
    );

    expect(screen.getByTestId("shop-avatar-uploader-preview")).toBeInTheDocument();
  });
});

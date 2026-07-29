import { beforeEach, describe, expect, it, vi } from "vitest";

const mockCreatePresignedPost = vi.fn();
vi.mock("@aws-sdk/s3-presigned-post", () => ({
  createPresignedPost: (...args: unknown[]) => mockCreatePresignedPost(...args),
}));
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(),
}));

import { createPresignedUpload, InvalidImageError, validateImageUpload } from "@/server/shops/storage";

const ORIGINAL_ENV = process.env;

beforeEach(() => {
  vi.clearAllMocks();
  process.env = {
    ...ORIGINAL_ENV,
    R2_ACCOUNT_ID: "account-1",
    R2_ACCESS_KEY_ID: "key",
    R2_SECRET_ACCESS_KEY: "secret",
    R2_BUCKET_NAME: "inkwell-media",
    R2_PUBLIC_URL: "https://media.inkwell.app",
    R2_ENVIRONMENT_PREFIX: "test",
  };
});

describe("validateImageUpload (BR-7)", () => {
  it("accepts allowed content types under the size limit", () => {
    expect(() => validateImageUpload("image/png", 1024)).not.toThrow();
    expect(() => validateImageUpload("image/jpeg", 1024)).not.toThrow();
    expect(() => validateImageUpload("image/webp", 1024)).not.toThrow();
  });

  it("rejects an unsupported content type", () => {
    expect(() => validateImageUpload("image/gif", 1024)).toThrow(InvalidImageError);
  });

  it("rejects a file over 5MB", () => {
    expect(() => validateImageUpload("image/png", 6 * 1024 * 1024)).toThrow(InvalidImageError);
  });

  it("rejects a zero or negative size", () => {
    expect(() => validateImageUpload("image/png", 0)).toThrow(InvalidImageError);
  });
});

describe("createPresignedUpload", () => {
  it("returns a presigned POST URL/fields and a public image URL scoped by the environment prefix", async () => {
    mockCreatePresignedPost.mockResolvedValue({
      url: "https://r2.example.com/inkwell-media",
      fields: { key: "test/shops/shop-1/x.png", "Content-Type": "image/png" },
    });

    const result = await createPresignedUpload("shops/shop-1/x.png", "image/png");

    expect(result.objectKey).toBe("test/shops/shop-1/x.png");
    expect(result.imageUrl).toBe("https://media.inkwell.app/test/shops/shop-1/x.png");
    expect(result.uploadUrl).toBe("https://r2.example.com/inkwell-media");
    expect(result.uploadFields).toEqual({ key: "test/shops/shop-1/x.png", "Content-Type": "image/png" });
  });

  it("enforces a server-side content-length-range condition so an oversized upload is rejected by R2, not just at request time", async () => {
    mockCreatePresignedPost.mockResolvedValue({
      url: "https://r2.example.com/inkwell-media",
      fields: {},
    });

    await createPresignedUpload("shops/shop-1/x.png", "image/png");

    const [, options] = mockCreatePresignedPost.mock.calls[0];
    expect(options.Conditions).toEqual(
      expect.arrayContaining([
        ["content-length-range", 1, 5 * 1024 * 1024],
        ["eq", "$Content-Type", "image/png"],
      ]),
    );
  });

  it("retries once on failure before giving up", async () => {
    mockCreatePresignedPost
      .mockRejectedValueOnce(new Error("transient network error"))
      .mockResolvedValueOnce({ url: "https://r2.example.com/inkwell-media", fields: {} });

    const result = await createPresignedUpload("shops/shop-1/x.png", "image/png");

    expect(mockCreatePresignedPost).toHaveBeenCalledTimes(2);
    expect(result.uploadUrl).toBe("https://r2.example.com/inkwell-media");
  });

  it("throws the original error when the retry also fails", async () => {
    mockCreatePresignedPost
      .mockRejectedValueOnce(new Error("first failure"))
      .mockRejectedValueOnce(new Error("second failure"));

    await expect(createPresignedUpload("shops/shop-1/x.png", "image/png")).rejects.toThrow(
      "first failure",
    );
  });
});

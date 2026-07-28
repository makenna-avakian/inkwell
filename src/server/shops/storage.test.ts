import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetSignedUrl = vi.fn();
vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: (...args: unknown[]) => mockGetSignedUrl(...args),
}));
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(),
  PutObjectCommand: vi.fn((input: unknown) => ({ input })),
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
  it("returns a presigned URL and a public image URL scoped by the environment prefix", async () => {
    mockGetSignedUrl.mockResolvedValue("https://r2.example.com/presigned-put-url");

    const result = await createPresignedUpload("shops/shop-1/x.png", "image/png");

    expect(result.objectKey).toBe("test/shops/shop-1/x.png");
    expect(result.imageUrl).toBe("https://media.inkwell.app/test/shops/shop-1/x.png");
    expect(result.uploadUrl).toBe("https://r2.example.com/presigned-put-url");
  });

  it("retries once on failure before giving up", async () => {
    mockGetSignedUrl
      .mockRejectedValueOnce(new Error("transient network error"))
      .mockResolvedValueOnce("https://r2.example.com/presigned-put-url");

    const result = await createPresignedUpload("shops/shop-1/x.png", "image/png");

    expect(mockGetSignedUrl).toHaveBeenCalledTimes(2);
    expect(result.uploadUrl).toBe("https://r2.example.com/presigned-put-url");
  });

  it("throws the original error when the retry also fails", async () => {
    mockGetSignedUrl
      .mockRejectedValueOnce(new Error("first failure"))
      .mockRejectedValueOnce(new Error("second failure"));

    await expect(createPresignedUpload("shops/shop-1/x.png", "image/png")).rejects.toThrow(
      "first failure",
    );
  });
});

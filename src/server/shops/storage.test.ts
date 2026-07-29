import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetSignedUrl = vi.fn();
vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: (...args: unknown[]) => mockGetSignedUrl(...args),
}));
const mockSend = vi.fn();
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn().mockImplementation(() => ({ send: mockSend })),
  PutObjectCommand: vi.fn((input: unknown) => ({ command: "Put", input })),
  HeadObjectCommand: vi.fn((input: unknown) => ({ command: "Head", input })),
  DeleteObjectCommand: vi.fn((input: unknown) => ({ command: "Delete", input })),
}));

import {
  createPresignedUpload,
  InvalidImageError,
  validateImageUpload,
  verifyUploadedImageSize,
} from "@/server/shops/storage";

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
  it("returns a presigned PUT URL and a public image URL scoped by the environment prefix", async () => {
    mockGetSignedUrl.mockResolvedValue("https://r2.example.com/inkwell-media/test/shops/shop-1/x.png");

    const result = await createPresignedUpload("shops/shop-1/x.png", "image/png");

    expect(result.objectKey).toBe("test/shops/shop-1/x.png");
    expect(result.imageUrl).toBe("https://media.inkwell.app/test/shops/shop-1/x.png");
    expect(result.uploadUrl).toBe("https://r2.example.com/inkwell-media/test/shops/shop-1/x.png");
  });

  it("signs a PUT for the declared bucket, key, and content type (R2 doesn't support presigned POST)", async () => {
    mockGetSignedUrl.mockResolvedValue("https://r2.example.com/inkwell-media");

    await createPresignedUpload("shops/shop-1/x.png", "image/png");

    const [, command] = mockGetSignedUrl.mock.calls[0];
    expect(command.input).toEqual({
      Bucket: "inkwell-media",
      Key: "test/shops/shop-1/x.png",
      ContentType: "image/png",
    });
  });

  it("retries once on failure before giving up", async () => {
    mockGetSignedUrl
      .mockRejectedValueOnce(new Error("transient network error"))
      .mockResolvedValueOnce("https://r2.example.com/inkwell-media");

    const result = await createPresignedUpload("shops/shop-1/x.png", "image/png");

    expect(mockGetSignedUrl).toHaveBeenCalledTimes(2);
    expect(result.uploadUrl).toBe("https://r2.example.com/inkwell-media");
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

describe("verifyUploadedImageSize (BR-7 compensating control for presigned PUT)", () => {
  it("accepts an object at or under the size limit", async () => {
    mockSend.mockResolvedValueOnce({ ContentLength: 1024 });

    await expect(
      verifyUploadedImageSize("https://media.inkwell.app/test/shops/shop-1/x.png"),
    ).resolves.toBeUndefined();

    const [headCall] = mockSend.mock.calls[0];
    expect(headCall).toEqual({
      command: "Head",
      input: { Bucket: "inkwell-media", Key: "test/shops/shop-1/x.png" },
    });
  });

  it("deletes the object and rejects when it's over the 5MB limit", async () => {
    mockSend
      .mockResolvedValueOnce({ ContentLength: 6 * 1024 * 1024 })
      .mockResolvedValueOnce({});

    await expect(
      verifyUploadedImageSize("https://media.inkwell.app/test/shops/shop-1/x.png"),
    ).rejects.toThrow(InvalidImageError);

    const [deleteCall] = mockSend.mock.calls[1];
    expect(deleteCall).toEqual({
      command: "Delete",
      input: { Bucket: "inkwell-media", Key: "test/shops/shop-1/x.png" },
    });
  });

  it("rejects when the object's size can't be determined", async () => {
    mockSend.mockResolvedValueOnce({ ContentLength: undefined }).mockResolvedValueOnce({});

    await expect(
      verifyUploadedImageSize("https://media.inkwell.app/test/shops/shop-1/x.png"),
    ).rejects.toThrow(InvalidImageError);
  });

  it("rejects a URL that isn't under this bucket's public URL", async () => {
    await expect(verifyUploadedImageSize("https://evil.example.com/x.png")).rejects.toThrow(
      InvalidImageError,
    );
    expect(mockSend).not.toHaveBeenCalled();
  });
});

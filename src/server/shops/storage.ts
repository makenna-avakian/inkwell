import { DeleteObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const PRESIGN_EXPIRY_SECONDS = 5 * 60; // BR: short-lived (nfr-requirements.md)
const CALL_TIMEOUT_MS = 5_000; // nfr-design-patterns.md Question 1: A
const RETRY_DELAY_MS = 100;

const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // BR-7

export class InvalidImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidImageError";
  }
}

function client(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    // Cloudflare's own recommendation for the AWS SDK against R2 — R2 also
    // doesn't implement the S3 "POST Object" presigned-POST operation (only
    // presigned PUT), which is why this generates PUT URLs below.
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
    requestHandler: { requestTimeout: CALL_TIMEOUT_MS },
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withOneRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (firstError) {
    await sleep(RETRY_DELAY_MS);
    try {
      return await fn();
    } catch {
      throw firstError;
    }
  }
}

/** BR-7: validate before ever generating a presigned URL. */
export function validateImageUpload(contentType: string, sizeBytes: number): void {
  if (!ALLOWED_CONTENT_TYPES.includes(contentType as (typeof ALLOWED_CONTENT_TYPES)[number])) {
    throw new InvalidImageError("Unsupported image type. Use JPEG, PNG, or WebP.");
  }
  if (sizeBytes <= 0 || sizeBytes > MAX_FILE_SIZE_BYTES) {
    throw new InvalidImageError("Image must be under 5MB.");
  }
}

export interface PresignedUpload {
  uploadUrl: string;
  imageUrl: string;
  objectKey: string;
}

/**
 * Generates a presigned PUT URL scoped to a single object key and content
 * type. R2 does not implement the S3 "POST Object" (presigned-POST/form)
 * operation used by some S3-compatible upload flows — attempting it returns
 * a 501 Not Implemented — so this signs a plain PUT instead, which R2 does
 * support. Unlike a presigned POST policy, a presigned PUT can't have R2
 * itself enforce a content-length-range condition at upload time — see
 * verifyUploadedImageSize below for the compensating check.
 */
export async function createPresignedUpload(
  objectKeyPath: string,
  contentType: string,
): Promise<PresignedUpload> {
  const environmentPrefix = process.env.R2_ENVIRONMENT_PREFIX ?? "dev";
  const objectKey = `${environmentPrefix}/${objectKeyPath}`;
  const bucket = process.env.R2_BUCKET_NAME!;

  const uploadUrl = await withOneRetry(() =>
    getSignedUrl(
      client(),
      new PutObjectCommand({ Bucket: bucket, Key: objectKey, ContentType: contentType }),
      { expiresIn: PRESIGN_EXPIRY_SECONDS },
    ),
  );

  return {
    uploadUrl,
    imageUrl: `${process.env.R2_PUBLIC_URL}/${objectKey}`,
    objectKey,
  };
}

/**
 * BR-7 compensating control: since a presigned PUT (unlike the presigned
 * POST R2 doesn't support) can't have R2 itself reject an oversized body at
 * upload time, this re-checks the actual stored object's size immediately
 * after upload — a caller could otherwise request a URL for a declared 1KB
 * file and then PUT an arbitrarily large one straight through it, bypassing
 * validateImageUpload's caller-declared-size check entirely. Deletes the
 * object and throws if it's missing or over the limit, so an oversized
 * upload never gets persisted as a real portfolio/listing/shop image.
 */
export async function verifyUploadedImageSize(imageUrl: string): Promise<void> {
  const publicUrlPrefix = `${process.env.R2_PUBLIC_URL}/`;
  if (!imageUrl.startsWith(publicUrlPrefix)) {
    throw new InvalidImageError("Couldn't verify the uploaded image.");
  }
  const objectKey = imageUrl.slice(publicUrlPrefix.length);
  const bucket = process.env.R2_BUCKET_NAME!;
  const s3 = client();

  const { ContentLength } = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: objectKey }));
  if (ContentLength === undefined || ContentLength > MAX_FILE_SIZE_BYTES) {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey })).catch(() => {});
    throw new InvalidImageError("Image must be under 5MB.");
  }
}

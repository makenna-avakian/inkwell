import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
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
 * type (NFR Requirements: Question 3: A / nfr-requirements.md's security note
 * — a leaked URL can't be reused for a different file or after expiry).
 */
export async function createPresignedUpload(
  objectKeyPath: string,
  contentType: string,
): Promise<PresignedUpload> {
  const environmentPrefix = process.env.R2_ENVIRONMENT_PREFIX ?? "dev";
  const objectKey = `${environmentPrefix}/${objectKeyPath}`;
  const bucket = process.env.R2_BUCKET_NAME!;

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    ContentType: contentType,
  });

  const uploadUrl = await withOneRetry(() =>
    getSignedUrl(client(), command, { expiresIn: PRESIGN_EXPIRY_SECONDS }),
  );

  return {
    uploadUrl,
    imageUrl: `${process.env.R2_PUBLIC_URL}/${objectKey}`,
    objectKey,
  };
}

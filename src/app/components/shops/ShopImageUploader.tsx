"use client";

import { useState } from "react";
import Image from "next/image";
import type { RequestUploadResult } from "@/app/(seller)/shop/actions";

interface ShopImageUploaderProps {
  shopId: string;
  label: string;
  helpText?: string;
  initialImageUrl: string | null;
  previewClassName: string;
  testIdPrefix: string;
  requestUploadUrlAction: (
    shopId: string,
    fileName: string,
    contentType: string,
    sizeBytes: number,
  ) => Promise<RequestUploadResult>;
  confirmImageAction: (shopId: string, imageUrl: string) => Promise<{ error?: string }>;
}

/** Single-image upload + replace (banner/avatar) — same presigned-upload flow as PortfolioManager, one image instead of an appendable list. */
export default function ShopImageUploader({
  shopId,
  label,
  helpText,
  initialImageUrl,
  previewClassName,
  testIdPrefix,
  requestUploadUrlAction,
  confirmImageAction,
}: ShopImageUploaderProps) {
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handleFileSelected(file: File) {
    setUploading(true);
    setError(undefined);
    try {
      const { uploadUrl, imageUrl: newImageUrl, error: requestError } = await requestUploadUrlAction(
        shopId,
        file.name,
        file.type,
        file.size,
      );
      if (requestError || !uploadUrl || !newImageUrl) {
        setError(requestError ?? "Couldn't start upload.");
        return;
      }

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadResponse.ok) {
        setError("Upload failed. Please try again.");
        return;
      }

      const { error: confirmError } = await confirmImageAction(shopId, newImageUrl);
      if (confirmError) {
        setError(confirmError);
        return;
      }

      setImageUrl(newImageUrl);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div data-testid={testIdPrefix}>
      <p className="mb-2 text-sm font-medium text-foreground">{label}</p>
      {helpText && <p className="mb-2 text-xs text-muted">{helpText}</p>}
      {error && (
        <p role="alert" data-testid={`${testIdPrefix}-error`} className="mb-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {imageUrl && (
        <Image
          src={imageUrl}
          alt=""
          width={400}
          height={200}
          data-testid={`${testIdPrefix}-preview`}
          className={previewClassName}
        />
      )}

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={uploading}
        data-testid={`${testIdPrefix}-file-input`}
        className="mt-2 block text-sm text-foreground"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFileSelected(file);
        }}
      />
    </div>
  );
}

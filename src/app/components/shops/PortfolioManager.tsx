"use client";

import { useState } from "react";
import Image from "next/image";
import {
  confirmPortfolioImageAction,
  requestPortfolioUploadUrlAction,
} from "@/app/(seller)/shop/actions";

interface PortfolioImage {
  id: string;
  imageUrl: string;
}

interface PortfolioManagerProps {
  shopId: string;
  initialImages: PortfolioImage[];
}

export default function PortfolioManager({ shopId, initialImages }: PortfolioManagerProps) {
  const [images, setImages] = useState(initialImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handleFileSelected(file: File) {
    setUploading(true);
    setError(undefined);
    try {
      const { uploadUrl, uploadFields, imageUrl, error: requestError } =
        await requestPortfolioUploadUrlAction(shopId, file.name, file.type, file.size);
      if (requestError || !uploadUrl || !uploadFields || !imageUrl) {
        setError(requestError ?? "Couldn't start upload.");
        return;
      }

      const formData = new FormData();
      for (const [key, value] of Object.entries(uploadFields)) {
        formData.set(key, value);
      }
      formData.set("file", file);

      const uploadResponse = await fetch(uploadUrl, { method: "POST", body: formData });
      if (!uploadResponse.ok) {
        setError("Upload failed. Please try again.");
        return;
      }

      const { error: confirmError } = await confirmPortfolioImageAction(shopId, imageUrl);
      if (confirmError) {
        setError(confirmError);
        return;
      }

      setImages((prev) => [...prev, { id: imageUrl, imageUrl }]);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div data-testid="portfolio-manager">
      {error && (
        <p role="alert" data-testid="portfolio-manager-error" className="mb-3 text-red-700">
          {error}
        </p>
      )}

      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={uploading}
        data-testid="portfolio-manager-file-input"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFileSelected(file);
        }}
      />

      <div className="mt-4 grid grid-cols-3 gap-4">
        {images.map((image) => (
          <Image
            key={image.id}
            src={image.imageUrl}
            alt=""
            width={200}
            height={200}
            className="object-cover"
          />
        ))}
      </div>
    </div>
  );
}

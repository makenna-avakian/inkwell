"use client";

import { useState } from "react";
import Image from "next/image";
import {
  confirmPortfolioImageAction,
  deletePortfolioImageAction,
  reorderPortfolioImagesAction,
  requestPortfolioUploadUrlAction,
  setFeaturedPortfolioImageAction,
  updatePortfolioImageAction,
} from "@/app/(seller)/shop/actions";

export interface PortfolioImage {
  id: string;
  imageUrl: string;
  title: string | null;
  caption: string | null;
  tags: string[];
  listingId: string | null;
  featured: boolean;
}

export interface ListingOption {
  id: string;
  title: string;
}

interface PortfolioManagerProps {
  shopId: string;
  initialImages: PortfolioImage[];
  listingOptions: ListingOption[];
}

interface EditDraft {
  title: string;
  caption: string;
  tagsInput: string;
  listingId: string;
}

function draftFromImage(image: PortfolioImage): EditDraft {
  return {
    title: image.title ?? "",
    caption: image.caption ?? "",
    tagsInput: image.tags.join(", "),
    listingId: image.listingId ?? "",
  };
}

export default function PortfolioManager({ shopId, initialImages, listingOptions }: PortfolioManagerProps) {
  const [images, setImages] = useState(initialImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  async function handleFileSelected(file: File) {
    setUploading(true);
    setError(undefined);
    try {
      const { uploadUrl, imageUrl, error: requestError } =
        await requestPortfolioUploadUrlAction(shopId, file.name, file.type, file.size);
      if (requestError || !uploadUrl || !imageUrl) {
        setError(requestError ?? "Couldn't start upload.");
        return;
      }

      let uploadResponse: Response;
      try {
        uploadResponse = await fetch(uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
      } catch {
        // A network-level failure here (rather than a non-2xx response) usually
        // means the storage bucket's CORS policy doesn't allow this origin.
        setError("Upload failed — the storage service rejected the request. Please try again.");
        return;
      }
      if (!uploadResponse.ok) {
        setError("Upload failed. Please try again.");
        return;
      }

      const { error: confirmError, id } = await confirmPortfolioImageAction(shopId, imageUrl);
      if (confirmError || !id) {
        setError(confirmError ?? "Couldn't save the image.");
        return;
      }

      setImages((prev) => [
        ...prev,
        { id, imageUrl, title: null, caption: null, tags: [], listingId: null, featured: false },
      ]);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function startEditing(image: PortfolioImage) {
    setEditingId(image.id);
    setDraft(draftFromImage(image));
    setError(undefined);
  }

  function cancelEditing() {
    setEditingId(null);
    setDraft(null);
  }

  async function saveEditing(imageId: string) {
    if (!draft) return;
    setSavingId(imageId);
    setError(undefined);
    try {
      const tags = draft.tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      const result = await updatePortfolioImageAction(shopId, imageId, {
        title: draft.title.trim() || undefined,
        caption: draft.caption.trim() || undefined,
        tags,
        listingId: draft.listingId || null,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setImages((prev) =>
        prev.map((image) =>
          image.id === imageId
            ? {
                ...image,
                title: draft.title.trim() || null,
                caption: draft.caption.trim() || null,
                tags,
                listingId: draft.listingId || null,
              }
            : image,
        ),
      );
      setEditingId(null);
      setDraft(null);
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(imageId: string) {
    setError(undefined);
    const result = await deletePortfolioImageAction(shopId, imageId);
    if (result.error) {
      setError(result.error);
      return;
    }
    setImages((prev) => prev.filter((image) => image.id !== imageId));
    if (editingId === imageId) cancelEditing();
  }

  async function handleSetFeatured(imageId: string) {
    setError(undefined);
    const result = await setFeaturedPortfolioImageAction(shopId, imageId);
    if (result.error) {
      setError(result.error);
      return;
    }
    setImages((prev) => prev.map((image) => ({ ...image, featured: image.id === imageId })));
  }

  async function commitReorder(nextOrder: PortfolioImage[]) {
    setImages(nextOrder);
    const result = await reorderPortfolioImagesAction(
      shopId,
      nextOrder.map((image) => image.id),
    );
    if (result.error) setError(result.error);
  }

  function moveBy(index: number, delta: number) {
    const targetIndex = index + delta;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const next = [...images];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    void commitReorder(next);
  }

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      return;
    }
    const fromIndex = images.findIndex((image) => image.id === dragId);
    const toIndex = images.findIndex((image) => image.id === targetId);
    if (fromIndex === -1 || toIndex === -1) {
      setDragId(null);
      return;
    }
    const next = [...images];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setDragId(null);
    void commitReorder(next);
  }

  return (
    <div data-testid="portfolio-manager">
      <p className="mb-4 max-w-prose text-sm text-muted">
        Your portfolio is the first thing visitors see on your shop page. Add titles, mediums, and
        link pieces to listings that are for sale — feature your best piece to lead with it.
      </p>

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
          e.target.value = "";
        }}
      />
      {uploading && <p className="mt-2 text-sm text-muted">Uploading…</p>}

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((image, index) => (
          <div
            key={image.id}
            data-testid={`portfolio-piece-${image.id}`}
            draggable
            onDragStart={() => setDragId(image.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(image.id)}
            className={`border p-3 ${image.featured ? "border-2 border-accent" : "border-border"}`}
          >
            <div className="relative">
              <Image
                src={image.imageUrl}
                alt=""
                width={400}
                height={400}
                className="aspect-square w-full object-cover"
              />
              {image.featured && (
                <span
                  data-testid={`portfolio-piece-${image.id}-featured-badge`}
                  className="absolute top-2 left-2 border border-accent bg-surface px-2 py-1 text-xs font-medium tracking-[0.1em] text-accent uppercase"
                >
                  Featured
                </span>
              )}
            </div>

            {editingId === image.id && draft ? (
              <div className="mt-3 space-y-2">
                <input
                  type="text"
                  placeholder="Title"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  data-testid={`portfolio-piece-${image.id}-title-input`}
                  className="w-full border border-border bg-surface p-2 text-sm text-foreground focus:border-accent focus:outline-none"
                />
                <textarea
                  placeholder="Caption — medium, story, process…"
                  value={draft.caption}
                  onChange={(e) => setDraft({ ...draft, caption: e.target.value })}
                  data-testid={`portfolio-piece-${image.id}-caption-input`}
                  className="w-full border border-border bg-surface p-2 text-sm text-foreground focus:border-accent focus:outline-none"
                  rows={2}
                />
                <input
                  type="text"
                  placeholder="Tags, comma separated"
                  value={draft.tagsInput}
                  onChange={(e) => setDraft({ ...draft, tagsInput: e.target.value })}
                  data-testid={`portfolio-piece-${image.id}-tags-input`}
                  className="w-full border border-border bg-surface p-2 text-sm text-foreground focus:border-accent focus:outline-none"
                />
                {listingOptions.length > 0 && (
                  <select
                    value={draft.listingId}
                    onChange={(e) => setDraft({ ...draft, listingId: e.target.value })}
                    data-testid={`portfolio-piece-${image.id}-listing-select`}
                    className="w-full border border-border bg-surface p-2 text-sm text-foreground focus:border-accent focus:outline-none"
                  >
                    <option value="">Not linked to a listing</option>
                    {listingOptions.map((listing) => (
                      <option key={listing.id} value={listing.id}>
                        {listing.title}
                      </option>
                    ))}
                  </select>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void saveEditing(image.id)}
                    disabled={savingId === image.id}
                    data-testid={`portfolio-piece-${image.id}-save-button`}
                    className="border border-foreground bg-foreground px-3 py-1.5 text-xs font-medium tracking-[0.1em] text-surface uppercase transition-colors hover:border-accent hover:bg-accent disabled:opacity-50"
                  >
                    {savingId === image.id ? "Saving…" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="border border-border px-3 py-1.5 text-xs font-medium tracking-[0.1em] text-foreground uppercase transition-colors hover:border-accent hover:text-accent"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3">
                <p className="text-sm font-medium text-foreground">{image.title || "Untitled"}</p>
                {image.caption && <p className="mt-1 text-sm text-muted">{image.caption}</p>}
                {image.tags.length > 0 && (
                  <p className="mt-1 text-xs tracking-[0.08em] text-muted uppercase">
                    {image.tags.join(" · ")}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startEditing(image)}
                    data-testid={`portfolio-piece-${image.id}-edit-button`}
                    className="border border-border px-3 py-1.5 text-xs font-medium tracking-[0.1em] text-foreground uppercase transition-colors hover:border-accent hover:text-accent"
                  >
                    Edit
                  </button>
                  {!image.featured && (
                    <button
                      type="button"
                      onClick={() => void handleSetFeatured(image.id)}
                      data-testid={`portfolio-piece-${image.id}-feature-button`}
                      className="border border-border px-3 py-1.5 text-xs font-medium tracking-[0.1em] text-foreground uppercase transition-colors hover:border-accent hover:text-accent"
                    >
                      Feature
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => moveBy(index, -1)}
                    disabled={index === 0}
                    aria-label="Move earlier"
                    data-testid={`portfolio-piece-${image.id}-move-up-button`}
                    className="border border-border px-3 py-1.5 text-xs font-medium tracking-[0.1em] text-foreground uppercase transition-colors hover:border-accent hover:text-accent disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveBy(index, 1)}
                    disabled={index === images.length - 1}
                    aria-label="Move later"
                    data-testid={`portfolio-piece-${image.id}-move-down-button`}
                    className="border border-border px-3 py-1.5 text-xs font-medium tracking-[0.1em] text-foreground uppercase transition-colors hover:border-accent hover:text-accent disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(image.id)}
                    data-testid={`portfolio-piece-${image.id}-delete-button`}
                    className="border border-border px-3 py-1.5 text-xs font-medium tracking-[0.1em] text-red-700 uppercase transition-colors hover:border-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

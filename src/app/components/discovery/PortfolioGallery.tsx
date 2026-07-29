"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export interface PortfolioGalleryImage {
  id: string;
  imageUrl: string;
  title: string | null;
  caption: string | null;
  tags: string[];
  listingId: string | null;
  featured: boolean;
}

interface PortfolioGalleryProps {
  images: PortfolioGalleryImage[];
  availableListingIds: string[];
}

export default function PortfolioGallery({ images, availableListingIds }: PortfolioGalleryProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const availableSet = new Set(availableListingIds);

  useEffect(() => {
    if (!openId) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenId(null);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openId]);

  if (images.length === 0) {
    return (
      <p data-testid="portfolio-gallery-empty" className="text-muted">
        This shop hasn&apos;t added any portfolio pieces yet.
      </p>
    );
  }

  const openImage = images.find((image) => image.id === openId) ?? null;

  return (
    <div data-testid="portfolio-gallery">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {images.map((image) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setOpenId(image.id)}
            data-testid={`portfolio-gallery-thumb-${image.id}`}
            className={`group relative block overflow-hidden text-left ${
              image.featured ? "col-span-2 row-span-2" : ""
            }`}
          >
            <Image
              src={image.imageUrl}
              alt={image.title ?? ""}
              width={image.featured ? 800 : 400}
              height={image.featured ? 800 : 400}
              className="aspect-square w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
            {image.title && (
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2 text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                {image.title}
              </span>
            )}
          </button>
        ))}
      </div>

      {openImage && (
        <div
          role="dialog"
          aria-modal="true"
          data-testid="portfolio-gallery-lightbox"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          onClick={() => setOpenId(null)}
        >
          <div
            className="flex max-h-full max-w-4xl flex-col overflow-hidden bg-surface md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex-1 bg-black">
              <Image
                src={openImage.imageUrl}
                alt={openImage.title ?? ""}
                width={900}
                height={900}
                className="max-h-[80vh] w-full object-contain"
              />
            </div>
            <div className="w-full space-y-3 p-6 md:w-72">
              <button
                type="button"
                onClick={() => setOpenId(null)}
                data-testid="portfolio-gallery-lightbox-close"
                className="text-xs font-medium tracking-[0.1em] text-muted uppercase transition-colors hover:text-accent"
              >
                Close ✕
              </button>
              <h3 className="font-serif text-2xl font-medium text-foreground">
                {openImage.title || "Untitled"}
              </h3>
              {openImage.caption && <p className="text-sm text-muted">{openImage.caption}</p>}
              {openImage.tags.length > 0 && (
                <p className="text-xs tracking-[0.08em] text-muted uppercase">
                  {openImage.tags.join(" · ")}
                </p>
              )}
              {openImage.listingId && availableSet.has(openImage.listingId) && (
                <a
                  href={`#listing-${openImage.listingId}`}
                  onClick={() => setOpenId(null)}
                  data-testid="portfolio-gallery-lightbox-listing-link"
                  className="inline-block border border-foreground px-4 py-2 text-xs font-medium tracking-[0.1em] text-foreground uppercase transition-colors hover:border-accent hover:text-accent"
                >
                  Available now →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

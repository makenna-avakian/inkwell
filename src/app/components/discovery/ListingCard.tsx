import Link from "next/link";
import Image from "next/image";
import { isCommissionAvailable } from "@/server/discovery/filters";

interface ListingCardProps {
  listingId: string;
  title: string;
  priceCents: number;
  imageUrl: string | null;
  styleTags: string[];
  shopId: string;
  shopDisplayName: string;
  shopSlotState: "open" | "closed" | "waitlist";
}

// Warm-neutral tints in the same tonal family as the site's cream/terracotta
// palette (globals.css), for the artist-initials avatar — deliberately not
// the mockup's own blue/purple palette.
const AVATAR_TINTS = [
  { bg: "#f3e3da", fg: "#8c4326" },
  { bg: "#e8ead8", fg: "#5c6b45" },
  { bg: "#f0dfdd", fg: "#8a4a48" },
  { bg: "#e2e6e4", fg: "#4f5d5a" },
  { bg: "#f2e8d5", fg: "#8a6d2f" },
];

// One small muted sage tone for the "open for commission" signal — distinct
// from the generic tag-chip styling so it reads as a status, not a subject tag.
const OPEN_COMMISSION_COLOR = "#3f5c30";

// No real image dimensions are stored today — these deterministic height
// tiers (hashed from the listing id) fake the masonry look via object-cover
// cropping, without a schema change or client-side measurement.
const HEIGHT_TIERS = [220, 280, 340];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default function ListingCard({
  listingId,
  title,
  priceCents,
  imageUrl,
  styleTags,
  shopId,
  shopDisplayName,
  shopSlotState,
}: ListingCardProps) {
  const tint = AVATAR_TINTS[hashString(shopId) % AVATAR_TINTS.length];
  const imageHeight = HEIGHT_TIERS[hashString(listingId) % HEIGHT_TIERS.length];
  const visibleTags = styleTags.slice(0, 3);

  return (
    <Link
      href={`/shops/${shopId}`}
      data-testid={`listing-card-${listingId}`}
      className="mb-4 block break-inside-avoid overflow-hidden border border-border bg-surface transition-colors hover:border-foreground"
    >
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={title}
          width={400}
          height={imageHeight}
          style={{ height: imageHeight }}
          className="w-full object-cover"
        />
      )}
      <div className="p-4">
        {(visibleTags.length > 0 || isCommissionAvailable(shopSlotState)) && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {visibleTags.map((tag) => (
              <span
                key={tag}
                className="border border-border px-2 py-0.5 text-[11px] font-medium tracking-wide text-muted uppercase"
              >
                {tag}
              </span>
            ))}
            {isCommissionAvailable(shopSlotState) && (
              <span
                data-testid="listing-card-open-badge"
                style={{ borderColor: OPEN_COMMISSION_COLOR, color: OPEN_COMMISSION_COLOR }}
                className="border px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase"
              >
                Open for commission
              </span>
            )}
          </div>
        )}
        <h3 className="font-serif text-lg font-medium text-foreground">{title}</h3>
        <div className="mt-2 flex items-center gap-2">
          <span
            style={{ backgroundColor: tint.bg, color: tint.fg }}
            className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold"
          >
            {initialsOf(shopDisplayName)}
          </span>
          <span className="text-sm text-muted">{shopDisplayName}</span>
        </div>
        <p className="mt-2 font-medium text-foreground">${(priceCents / 100).toFixed(2)}</p>
      </div>
    </Link>
  );
}

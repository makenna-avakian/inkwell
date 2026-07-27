import Link from "next/link";
import Image from "next/image";

interface ListingCardProps {
  listingId: string;
  title: string;
  priceCents: number;
  imageUrl: string | null;
  shopId: string;
  shopDisplayName: string;
  shopSlotState: "open" | "closed" | "waitlist";
}

export default function ListingCard({
  listingId,
  title,
  priceCents,
  imageUrl,
  shopId,
  shopDisplayName,
  shopSlotState,
}: ListingCardProps) {
  return (
    <Link
      href={`/shops/${shopId}`}
      data-testid={`listing-card-${listingId}`}
      className="block overflow-hidden border border-border bg-surface transition-colors hover:border-foreground"
    >
      {imageUrl && (
        <Image src={imageUrl} alt={title} width={400} height={300} className="h-48 w-full object-cover" />
      )}
      <div className="p-4">
        <h3 className="font-serif text-lg font-medium text-foreground">{title}</h3>
        <p className="text-muted">${(priceCents / 100).toFixed(2)}</p>
        <p className="text-sm text-muted">
          {shopDisplayName} — <span data-testid="listing-card-slot-state">{shopSlotState}</span>
        </p>
      </div>
    </Link>
  );
}

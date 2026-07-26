"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createListingAction, type ListingActionState } from "@/app/(seller)/shop/listings/actions";

interface ListingSummary {
  id: string;
  title: string;
  priceCents: number;
  status: "available" | "sold" | "removed";
}

interface ListingManagerProps {
  shopId: string;
  initialListings: ListingSummary[];
}

const initialState: ListingActionState = { fieldErrors: {} };

export default function ListingManager({ shopId, initialListings }: ListingManagerProps) {
  const action = createListingAction.bind(null, shopId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div data-testid="listing-manager">
      <ul className="mb-8 space-y-2">
        {initialListings.map((listing) => (
          <li key={listing.id} data-testid={`listing-manager-row-${listing.id}`}>
            <Link href={`/shop/listings/${listing.id}`} className="underline">
              {listing.title}
            </Link>{" "}
            — ${(listing.priceCents / 100).toFixed(2)} ({listing.status})
          </li>
        ))}
      </ul>

      {state.formError && (
        <p role="alert" data-testid="listing-manager-error" className="mb-3 text-red-700">
          {state.formError}
        </p>
      )}

      <form action={formAction} className="space-y-4" data-testid="listing-manager-create-form">
        <input
          name="title"
          placeholder="Title"
          required
          data-testid="listing-manager-title-input"
          className="w-full rounded border border-gray-300 p-2"
        />
        <input
          name="description"
          placeholder="Description (optional)"
          data-testid="listing-manager-description-input"
          className="w-full rounded border border-gray-300 p-2"
        />
        <input
          name="medium"
          placeholder="Medium (e.g. Watercolor)"
          data-testid="listing-manager-medium-input"
          className="w-full rounded border border-gray-300 p-2"
        />
        <input
          name="styleTags"
          placeholder="Style tags, comma-separated (e.g. pet portrait, landscape)"
          data-testid="listing-manager-style-tags-input"
          className="w-full rounded border border-gray-300 p-2"
        />
        <input
          name="price"
          type="number"
          step="0.01"
          min="0"
          placeholder="Price"
          required
          data-testid="listing-manager-price-input"
          className="w-32 rounded border border-gray-300 p-2"
        />
        <button
          type="submit"
          disabled={pending}
          data-testid="listing-manager-create-button"
          className="rounded-lg bg-black px-6 py-3 text-white disabled:opacity-50"
        >
          {pending ? "Creating..." : "Create listing"}
        </button>
      </form>
    </div>
  );
}

"use client";

import { useActionState, useState } from "react";
import {
  setListingStatusAction,
  updateListingAction,
  type ListingActionState,
} from "@/app/(seller)/shop/listings/actions";

interface ListingEditFormProps {
  listingId: string;
  initialTitle: string;
  initialDescription?: string;
  initialPriceCents: number;
  initialStatus: "available" | "sold" | "removed";
  initialMedium?: string;
  initialStyleTags?: string[];
}

const initialState: ListingActionState = { fieldErrors: {} };

export default function ListingEditForm({
  listingId,
  initialTitle,
  initialDescription,
  initialPriceCents,
  initialStatus,
  initialMedium,
  initialStyleTags = [],
}: ListingEditFormProps) {
  const action = updateListingAction.bind(null, listingId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [status, setStatus] = useState(initialStatus);
  const [statusError, setStatusError] = useState<string | undefined>();

  async function handleStatusChange(next: "available" | "sold" | "removed") {
    const previous = status;
    setStatus(next);
    const result = await setListingStatusAction(listingId, next);
    if (result.error) {
      setStatus(previous);
      setStatusError(result.error);
    }
  }

  return (
    <div data-testid="listing-edit-form">
      {state.formError && (
        <p role="alert" data-testid="listing-edit-form-error" className="mb-3 text-red-700">
          {state.formError}
        </p>
      )}

      <form action={formAction} className="space-y-4">
        <input
          name="title"
          defaultValue={initialTitle}
          data-testid="listing-edit-form-title-input"
          className="w-full border border-border bg-surface p-2 text-foreground focus:border-accent focus:outline-none"
        />
        <input
          name="description"
          defaultValue={initialDescription}
          data-testid="listing-edit-form-description-input"
          className="w-full border border-border bg-surface p-2 text-foreground focus:border-accent focus:outline-none"
        />
        <input
          name="medium"
          defaultValue={initialMedium}
          data-testid="listing-edit-form-medium-input"
          className="w-full border border-border bg-surface p-2 text-foreground focus:border-accent focus:outline-none"
        />
        <input
          name="styleTags"
          defaultValue={initialStyleTags.join(", ")}
          data-testid="listing-edit-form-style-tags-input"
          className="w-full border border-border bg-surface p-2 text-foreground focus:border-accent focus:outline-none"
        />
        <input
          name="price"
          type="number"
          step="0.01"
          min="0"
          defaultValue={(initialPriceCents / 100).toFixed(2)}
          data-testid="listing-edit-form-price-input"
          className="w-32 border border-border bg-surface p-2 text-foreground focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          data-testid="listing-edit-form-save-button"
          className="border border-foreground bg-foreground px-6 py-3 text-xs font-medium tracking-[0.12em] text-surface uppercase transition-colors hover:border-accent hover:bg-accent disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save Changes"}
        </button>
      </form>

      <div className="mt-6 flex flex-wrap gap-2">
        {statusError && <p role="alert" className="w-full text-red-700">{statusError}</p>}
        <button
          type="button"
          onClick={() => handleStatusChange("sold")}
          disabled={status === "sold"}
          data-testid="listing-edit-form-mark-sold-button"
          className="border border-border px-4 py-2 text-xs font-medium tracking-[0.1em] text-foreground uppercase transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
        >
          Mark Sold
        </button>
        <button
          type="button"
          onClick={() => handleStatusChange("removed")}
          disabled={status === "removed"}
          data-testid="listing-edit-form-remove-button"
          className="border border-border px-4 py-2 text-xs font-medium tracking-[0.1em] text-foreground uppercase transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
        >
          Remove
        </button>
        <button
          type="button"
          onClick={() => handleStatusChange("available")}
          disabled={status === "available"}
          data-testid="listing-edit-form-restore-button"
          className="border border-border px-4 py-2 text-xs font-medium tracking-[0.1em] text-foreground uppercase transition-colors hover:border-accent hover:text-accent disabled:opacity-40"
        >
          Restore to Available
        </button>
      </div>
    </div>
  );
}

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
}

const initialState: ListingActionState = { fieldErrors: {} };

export default function ListingEditForm({
  listingId,
  initialTitle,
  initialDescription,
  initialPriceCents,
  initialStatus,
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
          className="w-full rounded border border-gray-300 p-2"
        />
        <input
          name="description"
          defaultValue={initialDescription}
          data-testid="listing-edit-form-description-input"
          className="w-full rounded border border-gray-300 p-2"
        />
        <input
          name="price"
          type="number"
          step="0.01"
          min="0"
          defaultValue={(initialPriceCents / 100).toFixed(2)}
          data-testid="listing-edit-form-price-input"
          className="w-32 rounded border border-gray-300 p-2"
        />
        <button
          type="submit"
          disabled={pending}
          data-testid="listing-edit-form-save-button"
          className="rounded-lg bg-black px-6 py-3 text-white disabled:opacity-50"
        >
          {pending ? "Saving..." : "Save changes"}
        </button>
      </form>

      <div className="mt-6">
        {statusError && <p role="alert">{statusError}</p>}
        <button
          type="button"
          onClick={() => handleStatusChange("sold")}
          disabled={status === "sold"}
          data-testid="listing-edit-form-mark-sold-button"
        >
          Mark Sold
        </button>
        <button
          type="button"
          onClick={() => handleStatusChange("removed")}
          disabled={status === "removed"}
          data-testid="listing-edit-form-remove-button"
        >
          Remove
        </button>
        <button
          type="button"
          onClick={() => handleStatusChange("available")}
          disabled={status === "available"}
          data-testid="listing-edit-form-restore-button"
        >
          Restore to Available
        </button>
      </div>
    </div>
  );
}

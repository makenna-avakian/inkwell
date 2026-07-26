"use client";

import { useActionState } from "react";
import { submitRequestAction, type RequestFormState } from "@/app/requests/actions";

interface Tier {
  id: string;
  name: string;
  priceCents: number;
}

interface CommissionRequestFormProps {
  shopId: string;
  tiers: Tier[];
}

const initialState: RequestFormState = {};

export default function CommissionRequestForm({ shopId, tiers }: CommissionRequestFormProps) {
  const action = submitRequestAction.bind(null, shopId);
  const [state, formAction, pending] = useActionState(action, initialState);

  if (state.success) {
    return (
      <p data-testid="commission-request-form-success">
        Request sent! You&apos;ll hear back from the artist soon.
      </p>
    );
  }

  return (
    <form action={formAction} data-testid="commission-request-form" className="space-y-4">
      {state.formError && (
        <p role="alert" data-testid="commission-request-form-error" className="text-red-700">
          {state.formError}
        </p>
      )}

      <div>
        <label htmlFor="tierId" className="mb-1 block text-sm font-medium">
          Tier
        </label>
        <select
          id="tierId"
          name="tierId"
          required
          data-testid="commission-request-form-tier-select"
          className="w-full rounded border border-gray-300 p-2"
        >
          {tiers.map((tier) => (
            <option key={tier.id} value={tier.id}>
              {tier.name} — ${(tier.priceCents / 100).toFixed(2)}
            </option>
          ))}
        </select>
      </div>

      <textarea
        name="description"
        placeholder="Describe what you'd like commissioned"
        required
        data-testid="commission-request-form-description-input"
        className="w-full rounded border border-gray-300 p-2"
      />

      <input
        name="budget"
        type="number"
        step="0.01"
        min="0"
        placeholder="Your budget (optional)"
        data-testid="commission-request-form-budget-input"
        className="w-full rounded border border-gray-300 p-2"
      />

      <input
        name="deadlinePreference"
        placeholder="Deadline preference (optional)"
        data-testid="commission-request-form-deadline-input"
        className="w-full rounded border border-gray-300 p-2"
      />

      <button
        type="submit"
        disabled={pending}
        data-testid="commission-request-form-submit-button"
        className="rounded-lg bg-black px-6 py-3 text-white disabled:opacity-50"
      >
        {pending ? "Sending..." : "Send request"}
      </button>
    </form>
  );
}

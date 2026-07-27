"use client";

import { useActionState } from "react";
import { updateDisplayNameAction, type AccountActionState } from "@/app/account/actions";

interface DisplayNameFormProps {
  initialDisplayName: string;
}

const initialState: AccountActionState = {};

export default function DisplayNameForm({ initialDisplayName }: DisplayNameFormProps) {
  const [state, formAction, pending] = useActionState(updateDisplayNameAction, initialState);

  return (
    <form action={formAction} data-testid="display-name-form" className="space-y-4">
      {state.formError && (
        <p role="alert" data-testid="display-name-form-error" className="text-sm text-red-700">
          {state.formError}
        </p>
      )}
      {state.success && (
        <p data-testid="display-name-form-success" className="text-sm text-muted">
          Display name updated.
        </p>
      )}

      <div>
        <label htmlFor="displayName" className="mb-1 block text-sm font-medium text-foreground">
          Display name
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          required
          defaultValue={initialDisplayName}
          data-testid="display-name-form-input"
          className="w-full border border-border bg-surface p-3 text-foreground focus:border-accent focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        data-testid="display-name-form-submit-button"
        className="border border-foreground bg-foreground px-6 py-3 text-xs font-medium tracking-[0.12em] text-surface uppercase transition-colors hover:border-accent hover:bg-accent disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}

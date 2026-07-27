"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePasswordAction, type AccountActionState } from "@/app/account/actions";

const initialState: AccountActionState = {};

export default function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} data-testid="change-password-form" className="space-y-4">
      {state.formError && (
        <p role="alert" data-testid="change-password-form-error" className="text-sm text-red-700">
          {state.formError}
        </p>
      )}
      {state.success && (
        <p data-testid="change-password-form-success" className="text-sm text-muted">
          Password updated.
        </p>
      )}

      <div>
        <label htmlFor="currentPassword" className="mb-1 block text-sm font-medium text-foreground">
          Current password
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          data-testid="change-password-form-current-input"
          className="w-full border border-border bg-surface p-3 text-foreground focus:border-accent focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="newPassword" className="mb-1 block text-sm font-medium text-foreground">
          New password
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          required
          minLength={8}
          data-testid="change-password-form-new-input"
          className="w-full border border-border bg-surface p-3 text-foreground focus:border-accent focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        data-testid="change-password-form-submit-button"
        className="border border-foreground bg-foreground px-6 py-3 text-xs font-medium tracking-[0.12em] text-surface uppercase transition-colors hover:border-accent hover:bg-accent disabled:opacity-50"
      >
        {pending ? "Updating..." : "Update Password"}
      </button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { signUpAction, type SignUpFormState } from "@/app/(auth)/sign-up/actions";
import AuthErrorBanner from "./AuthErrorBanner";
import OAuthButton from "./OAuthButton";

const initialState: SignUpFormState = { fieldErrors: {} };

export default function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);

  return (
    <div className="mx-auto w-full max-w-sm">
      {state.formError && <AuthErrorBanner message={state.formError} />}

      <form action={formAction} className="space-y-4" data-testid="sign-up-form">
        <div>
          <label htmlFor="displayName" className="mb-1 block text-sm font-medium">
            Display name (optional)
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            data-testid="sign-up-display-name-input"
            className="w-full rounded-lg border border-gray-300 p-3"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            data-testid="sign-up-email-input"
            className="w-full rounded-lg border border-gray-300 p-3"
          />
          {state.fieldErrors.email && (
            <p className="mt-1 text-sm text-red-700">{state.fieldErrors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            data-testid="sign-up-password-input"
            className="w-full rounded-lg border border-gray-300 p-3"
          />
          {state.fieldErrors.password && (
            <p className="mt-1 text-sm text-red-700">{state.fieldErrors.password}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={pending}
          data-testid="sign-up-submit-button"
          className="w-full rounded-lg bg-black py-3 text-white transition hover:bg-gray-800 disabled:opacity-50"
        >
          {pending ? "Creating account..." : "Sign up"}
        </button>
      </form>

      <div className="my-4 text-center text-sm text-gray-500">or</div>

      <OAuthButton provider="google" />
    </div>
  );
}

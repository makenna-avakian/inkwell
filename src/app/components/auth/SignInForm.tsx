"use client";

import { useActionState } from "react";
import { signInAction, type SignInFormState } from "@/app/(auth)/sign-in/actions";
import AuthErrorBanner from "./AuthErrorBanner";
import OAuthButton from "./OAuthButton";

const initialState: SignInFormState = {};

export default function SignInForm() {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <div className="mx-auto w-full max-w-sm">
      {/* Deliberately generic message — never reveals whether the email exists
          or the password was wrong (business-logic-model.md). */}
      {state.formError && <AuthErrorBanner message={state.formError} />}

      <form action={formAction} className="space-y-4" data-testid="sign-in-form">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            data-testid="sign-in-email-input"
            className="w-full rounded-lg border border-gray-300 p-3"
          />
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
            data-testid="sign-in-password-input"
            className="w-full rounded-lg border border-gray-300 p-3"
          />
        </div>

        <button
          type="submit"
          disabled={pending || !!state.retryAfterSeconds}
          data-testid="sign-in-submit-button"
          className="w-full rounded-lg bg-black py-3 text-white transition hover:bg-gray-800 disabled:opacity-50"
        >
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="my-4 text-center text-sm text-gray-500">or</div>

      <OAuthButton provider="google" />
    </div>
  );
}

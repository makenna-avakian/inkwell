"use client";

import { useActionState } from "react";
import { signInAction, type SignInFormState } from "@/app/(auth)/sign-in/actions";
import AuthErrorBanner from "./AuthErrorBanner";
import OAuthButton from "./OAuthButton";

const initialState: SignInFormState = {};

interface SignInFormProps {
  callbackUrl?: string;
}

export default function SignInForm({ callbackUrl = "/" }: SignInFormProps) {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <div className="mx-auto w-full max-w-sm">
      {/* Deliberately generic message — never reveals whether the email exists
          or the password was wrong (business-logic-model.md). */}
      {state.formError && <AuthErrorBanner message={state.formError} />}

      <form action={formAction} className="space-y-4" data-testid="sign-in-form">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
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
            className="w-full border border-border bg-surface p-3 text-foreground focus:border-accent focus:outline-none"
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
            className="w-full border border-border bg-surface p-3 text-foreground focus:border-accent focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={pending || !!state.retryAfterSeconds}
          data-testid="sign-in-submit-button"
          className="w-full border border-foreground bg-foreground py-3 text-xs font-medium tracking-[0.12em] text-surface uppercase transition-colors hover:border-accent hover:bg-accent disabled:opacity-50"
        >
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="my-4 text-center text-xs tracking-[0.12em] text-muted uppercase">or</div>

      <OAuthButton provider="google" callbackUrl={callbackUrl} />
    </div>
  );
}

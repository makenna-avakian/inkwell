"use client";

import { useState } from "react";
import { onboardSellerActionAction } from "@/app/orders/actions";

interface StripeOnboardingButtonProps {
  shopId: string;
  payoutsEnabled: boolean;
}

export default function StripeOnboardingButton({ shopId, payoutsEnabled }: StripeOnboardingButtonProps) {
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const result = await onboardSellerActionAction(shopId);
    if (result.checkoutUrl) {
      window.location.href = result.checkoutUrl;
      return;
    }
    setError(result.formError ?? "Something went wrong. Please try again.");
    setPending(false);
  }

  if (payoutsEnabled) {
    return (
      <p data-testid="stripe-onboarding-status" className="text-muted">
        Payments are set up — you can accept paid orders.
      </p>
    );
  }

  return (
    <div data-testid="stripe-onboarding-button">
      {error && <p role="alert" className="mb-2 text-sm text-red-700">{error}</p>}
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        data-testid="stripe-onboarding-submit-button"
        className="border border-foreground bg-foreground px-6 py-3 text-xs font-medium tracking-[0.12em] text-surface uppercase transition-colors hover:border-accent hover:bg-accent disabled:opacity-50"
      >
        {pending ? "Redirecting…" : "Set Up Payments with Stripe"}
      </button>
    </div>
  );
}

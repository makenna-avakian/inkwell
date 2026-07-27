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
    return <p data-testid="stripe-onboarding-status">Payments are set up — you can accept paid orders.</p>;
  }

  return (
    <div data-testid="stripe-onboarding-button">
      {error && <p role="alert">{error}</p>}
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        data-testid="stripe-onboarding-submit-button"
        className="rounded-lg bg-black px-6 py-3 text-white disabled:opacity-50"
      >
        {pending ? "Redirecting…" : "Set up payments with Stripe"}
      </button>
    </div>
  );
}

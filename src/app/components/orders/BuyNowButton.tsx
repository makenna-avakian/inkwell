"use client";

import { useState } from "react";
import { checkoutAction } from "@/app/orders/actions";

interface BuyNowButtonProps {
  listingId: string;
}

export default function BuyNowButton({ listingId }: BuyNowButtonProps) {
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    const result = await checkoutAction(listingId);
    if (result.checkoutUrl) {
      window.location.href = result.checkoutUrl;
      return;
    }
    setError(result.formError ?? "Something went wrong. Please try again.");
    setPending(false);
  }

  return (
    <div data-testid={`buy-now-button-${listingId}`}>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        data-testid={`buy-now-submit-button-${listingId}`}
        className="mt-2 w-full border border-foreground bg-foreground px-4 py-2 text-xs font-medium tracking-[0.12em] text-surface uppercase transition-colors hover:border-accent hover:bg-accent disabled:opacity-50"
      >
        {pending ? "Redirecting…" : "Buy Now"}
      </button>
    </div>
  );
}

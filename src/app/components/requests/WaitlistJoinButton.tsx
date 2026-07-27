"use client";

import { useState } from "react";
import { joinWaitlistAction } from "@/app/requests/actions";

interface WaitlistJoinButtonProps {
  shopId: string;
}

export default function WaitlistJoinButton({ shopId }: WaitlistJoinButtonProps) {
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function handleClick() {
    const result = await joinWaitlistAction(shopId);
    if (result.formError) {
      setError(result.formError);
    } else {
      setJoined(true);
    }
  }

  return (
    <div data-testid="waitlist-join-button">
      {error && <p role="alert" className="mb-2 text-sm text-red-700">{error}</p>}
      <button
        type="button"
        onClick={handleClick}
        disabled={joined}
        data-testid="waitlist-join-submit-button"
        className="border border-foreground px-6 py-3 text-xs font-medium tracking-[0.12em] text-foreground uppercase transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
      >
        {joined ? "Joined Waitlist" : "Join Waitlist"}
      </button>
    </div>
  );
}

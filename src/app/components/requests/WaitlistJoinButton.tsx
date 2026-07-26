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
      {error && <p role="alert">{error}</p>}
      <button
        type="button"
        onClick={handleClick}
        disabled={joined}
        data-testid="waitlist-join-submit-button"
        className="rounded-lg border border-gray-300 px-6 py-3 disabled:opacity-50"
      >
        {joined ? "Joined waitlist" : "Join waitlist"}
      </button>
    </div>
  );
}

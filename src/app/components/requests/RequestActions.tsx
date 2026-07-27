"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { declineRequestAction } from "@/app/requests/actions";
import { acceptAndCreateOrderAction } from "@/app/orders/actions";

interface RequestActionsProps {
  requestId: string;
}

export default function RequestActions({ requestId }: RequestActionsProps) {
  const router = useRouter();
  const [declineReason, setDeclineReason] = useState("");
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [done, setDone] = useState(false);

  /**
   * Accepting now also creates the escrowed Order (Unit 6). The buyer, not the
   * seller who's clicking Accept here, is the one who pays — so we refresh the
   * page rather than redirect; the buyer completes payment via OrderStatusPanel.
   */
  async function handleAccept() {
    const result = await acceptAndCreateOrderAction(requestId);
    if (result.formError) {
      setError(result.formError);
    } else {
      setDone(true);
      router.refresh();
    }
  }

  async function handleDecline() {
    const result = await declineRequestAction(requestId, declineReason);
    if (result.formError) setError(result.formError);
    else setDone(true);
  }

  if (done) return null;

  return (
    <div data-testid="request-actions" className="mt-4">
      {error && <p role="alert" className="mb-2 text-sm text-red-700">{error}</p>}

      <button
        type="button"
        onClick={handleAccept}
        data-testid="request-detail-accept-button"
        className="mr-2 border border-foreground bg-foreground px-6 py-3 text-xs font-medium tracking-[0.12em] text-surface uppercase transition-colors hover:border-accent hover:bg-accent"
      >
        Accept
      </button>

      {!showDeclineForm ? (
        <button
          type="button"
          onClick={() => setShowDeclineForm(true)}
          data-testid="request-detail-decline-button"
          className="border border-border px-6 py-3 text-xs font-medium tracking-[0.12em] text-foreground uppercase transition-colors hover:border-accent hover:text-accent"
        >
          Decline
        </button>
      ) : (
        <div className="mt-2">
          <input
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="Reason for declining"
            data-testid="request-detail-decline-reason-input"
            className="border border-border bg-surface p-2 text-foreground focus:border-accent focus:outline-none"
          />
          <button
            type="button"
            onClick={handleDecline}
            data-testid="request-detail-decline-confirm-button"
            className="ml-2 border border-foreground bg-foreground px-4 py-2 text-xs font-medium tracking-[0.1em] text-surface uppercase transition-colors hover:border-accent hover:bg-accent"
          >
            Confirm Decline
          </button>
        </div>
      )}
    </div>
  );
}

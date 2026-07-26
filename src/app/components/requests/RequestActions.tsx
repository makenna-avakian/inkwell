"use client";

import { useState } from "react";
import { acceptRequestAction, declineRequestAction } from "@/app/requests/actions";

interface RequestActionsProps {
  requestId: string;
}

export default function RequestActions({ requestId }: RequestActionsProps) {
  const [declineReason, setDeclineReason] = useState("");
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [done, setDone] = useState(false);

  async function handleAccept() {
    const result = await acceptRequestAction(requestId);
    if (result.formError) setError(result.formError);
    else setDone(true);
  }

  async function handleDecline() {
    const result = await declineRequestAction(requestId, declineReason);
    if (result.formError) setError(result.formError);
    else setDone(true);
  }

  if (done) return null;

  return (
    <div data-testid="request-actions" className="mt-4">
      {error && <p role="alert">{error}</p>}

      <button
        type="button"
        onClick={handleAccept}
        data-testid="request-detail-accept-button"
        className="mr-2 rounded-lg bg-black px-6 py-3 text-white"
      >
        Accept
      </button>

      {!showDeclineForm ? (
        <button
          type="button"
          onClick={() => setShowDeclineForm(true)}
          data-testid="request-detail-decline-button"
          className="rounded-lg border border-gray-300 px-6 py-3"
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
            className="rounded border border-gray-300 p-2"
          />
          <button
            type="button"
            onClick={handleDecline}
            data-testid="request-detail-decline-confirm-button"
            className="ml-2 rounded-lg bg-black px-4 py-2 text-white"
          >
            Confirm decline
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  approveDeliveryAction,
  cancelOrderAction,
  markInProgressAction,
  payOrderAction,
  requestRevisionAction,
  submitForReviewAction,
} from "@/app/orders/actions";
import { isCancellable, type OrderStatus } from "@/server/orders/transitions";

export interface OrderStatusPanelOrder {
  id: string;
  status: OrderStatus;
  buyerId: string;
  sellerId: string;
  subtotalCents: number;
  stripePaymentIntentId: string | null;
}

interface OrderStatusPanelProps {
  order: OrderStatusPanelOrder;
  currentUserId: string;
}

export default function OrderStatusPanel({ order, currentUserId }: OrderStatusPanelProps) {
  const [status, setStatus] = useState(order.status);
  const [revisionFeedback, setRevisionFeedback] = useState("");
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const isSeller = currentUserId === order.sellerId;
  const isBuyer = currentUserId === order.buyerId;

  async function run(action: () => Promise<{ formError?: string }>, nextStatus?: OrderStatus) {
    setError(undefined);
    const result = await action();
    if (result.formError) {
      setError(result.formError);
    } else if (nextStatus) {
      setStatus(nextStatus);
      setShowRevisionForm(false);
    }
  }

  return (
    <div data-testid="order-status-panel" className="mt-4 border border-border bg-surface p-4">
      <p data-testid="order-status-panel-status" className="text-xs font-medium tracking-[0.1em] text-muted uppercase">
        Order Status: <span className="text-foreground">{status}</span>
      </p>
      <p className="mt-1 font-serif text-lg text-foreground">${(order.subtotalCents / 100).toFixed(2)}</p>
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {isBuyer && status === "accepted" && !order.stripePaymentIntentId && (
          <button
            type="button"
            data-testid="order-status-panel-pay-button"
            onClick={() =>
              run(async () => {
                const result = await payOrderAction(order.id);
                if (result.checkoutUrl) window.location.href = result.checkoutUrl;
                return result;
              })
            }
            className="border border-foreground bg-foreground px-4 py-2 text-xs font-medium tracking-[0.1em] text-surface uppercase transition-colors hover:border-accent hover:bg-accent"
          >
            Complete payment
          </button>
        )}

        {isSeller && status === "accepted" && (
          <button
            type="button"
            data-testid="order-status-panel-mark-in-progress-button"
            onClick={() => run(() => markInProgressAction(order.id), "in_progress")}
            className="border border-foreground bg-foreground px-4 py-2 text-xs font-medium tracking-[0.1em] text-surface uppercase transition-colors hover:border-accent hover:bg-accent"
          >
            Mark in progress
          </button>
        )}

        {isSeller && status === "in_progress" && (
          <button
            type="button"
            data-testid="order-status-panel-submit-for-review-button"
            onClick={() => run(() => submitForReviewAction(order.id), "delivered")}
            className="border border-foreground bg-foreground px-4 py-2 text-xs font-medium tracking-[0.1em] text-surface uppercase transition-colors hover:border-accent hover:bg-accent"
          >
            Submit for review
          </button>
        )}

        {isBuyer && status === "delivered" && (
          <button
            type="button"
            data-testid="order-status-panel-approve-delivery-button"
            onClick={() => run(() => approveDeliveryAction(order.id), "completed")}
            className="border border-foreground bg-foreground px-4 py-2 text-xs font-medium tracking-[0.1em] text-surface uppercase transition-colors hover:border-accent hover:bg-accent"
          >
            Approve delivery
          </button>
        )}

        {isBuyer && status === "delivered" && !showRevisionForm && (
          <button
            type="button"
            data-testid="order-status-panel-request-revision-button"
            onClick={() => setShowRevisionForm(true)}
            className="border border-border px-4 py-2 text-xs font-medium tracking-[0.1em] text-foreground uppercase transition-colors hover:border-accent hover:text-accent"
          >
            Request Revision
          </button>
        )}

        {(isBuyer || isSeller) && isCancellable(status) && (
          <button
            type="button"
            data-testid="order-status-panel-cancel-button"
            onClick={() => run(() => cancelOrderAction(order.id), "cancelled")}
            className="border border-border px-4 py-2 text-xs font-medium tracking-[0.1em] text-red-700 uppercase transition-colors hover:border-red-700"
          >
            Cancel Order
          </button>
        )}
      </div>

      {showRevisionForm && (
        <div className="mt-3">
          <input
            value={revisionFeedback}
            onChange={(e) => setRevisionFeedback(e.target.value)}
            placeholder="What needs to change?"
            data-testid="order-status-panel-revision-feedback-input"
            className="w-full border border-border bg-surface p-2 text-foreground focus:border-accent focus:outline-none"
          />
          <button
            type="button"
            data-testid="order-status-panel-revision-confirm-button"
            onClick={() => run(() => requestRevisionAction(order.id, revisionFeedback), "in_progress")}
            className="mt-2 border border-foreground bg-foreground px-4 py-2 text-xs font-medium tracking-[0.1em] text-surface uppercase transition-colors hover:border-accent hover:bg-accent"
          >
            Send Revision Request
          </button>
        </div>
      )}
    </div>
  );
}

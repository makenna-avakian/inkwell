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
    <div data-testid="order-status-panel" className="mt-4 rounded-lg border border-gray-300 p-4">
      <p data-testid="order-status-panel-status" className="font-semibold">
        Order status: {status}
      </p>
      <p className="text-gray-600">Total: ${(order.subtotalCents / 100).toFixed(2)}</p>
      {error && <p role="alert">{error}</p>}

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
            className="rounded-lg bg-black px-4 py-2 text-white"
          >
            Complete payment
          </button>
        )}

        {isSeller && status === "accepted" && (
          <button
            type="button"
            data-testid="order-status-panel-mark-in-progress-button"
            onClick={() => run(() => markInProgressAction(order.id), "in_progress")}
            className="rounded-lg bg-black px-4 py-2 text-white"
          >
            Mark in progress
          </button>
        )}

        {isSeller && status === "in_progress" && (
          <button
            type="button"
            data-testid="order-status-panel-submit-for-review-button"
            onClick={() => run(() => submitForReviewAction(order.id), "delivered")}
            className="rounded-lg bg-black px-4 py-2 text-white"
          >
            Submit for review
          </button>
        )}

        {isBuyer && status === "delivered" && (
          <button
            type="button"
            data-testid="order-status-panel-approve-delivery-button"
            onClick={() => run(() => approveDeliveryAction(order.id), "completed")}
            className="rounded-lg bg-black px-4 py-2 text-white"
          >
            Approve delivery
          </button>
        )}

        {isBuyer && status === "delivered" && !showRevisionForm && (
          <button
            type="button"
            data-testid="order-status-panel-request-revision-button"
            onClick={() => setShowRevisionForm(true)}
            className="rounded-lg border border-gray-300 px-4 py-2"
          >
            Request revision
          </button>
        )}

        {(isBuyer || isSeller) && isCancellable(status) && (
          <button
            type="button"
            data-testid="order-status-panel-cancel-button"
            onClick={() => run(() => cancelOrderAction(order.id), "cancelled")}
            className="rounded-lg border border-gray-300 px-4 py-2 text-red-600"
          >
            Cancel order
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
            className="w-full rounded border border-gray-300 p-2"
          />
          <button
            type="button"
            data-testid="order-status-panel-revision-confirm-button"
            onClick={() => run(() => requestRevisionAction(order.id, revisionFeedback), "in_progress")}
            className="mt-2 rounded-lg bg-black px-4 py-2 text-white"
          >
            Send revision request
          </button>
        </div>
      )}
    </div>
  );
}

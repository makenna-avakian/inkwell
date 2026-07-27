export type OrderStatus = "accepted" | "in_progress" | "delivered" | "completed" | "cancelled";

/** The exhaustive allowed-edges list — business-logic-model.md's state machine. */
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  accepted: ["in_progress", "completed", "cancelled"], // completed: buy-now path (webhook-confirmed)
  in_progress: ["delivered", "cancelled"],
  delivered: ["in_progress", "completed"], // Q1:A revision re-enters in_progress
  completed: [],
  cancelled: [],
};

/** Pure — property-tested (PBT-01, business-rules.md). */
export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/** BR-1: exactly one of requestId/listingId, never both/neither. */
export function hasExactlyOneSource(
  requestId: string | null | undefined,
  listingId: string | null | undefined,
): boolean {
  return Boolean(requestId) !== Boolean(listingId);
}

/** BR-4 (Question 2: B): cancellation only from accepted/in_progress. */
export function isCancellable(status: OrderStatus): boolean {
  return status === "accepted" || status === "in_progress";
}

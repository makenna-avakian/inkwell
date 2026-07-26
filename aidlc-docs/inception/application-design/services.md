# Services — Inkwell (Phase 1)

Services orchestrate across components; they hold no primary data of their own (data ownership stays with the components in `components.md`).

## Service: CommissionLifecycleService
- **Responsibilities**: Orchestrates the full commission journey across `CommissionRequest`, `Order`, and `Payment`:
  1. On `CommissionRequest.acceptRequest` → creates the `Order` (`Order.createFromRequest`) → authorizes escrow (`Payment.authorizeEscrow`)
  2. On `Order.approveDelivery` → captures escrow and releases payout (`Payment.captureAndRelease`)
  3. On decline → ensures no `Order`/payment artifact is created
- **Why a service (not a component method)**: This sequence spans three components' write boundaries; keeping the orchestration here (rather than having components call each other directly) keeps each component's own responsibilities single-purpose and testable in isolation.

## Service: CheckoutService
- **Responsibilities**: Orchestrates the direct "buy now" path across `Listing`, `Order`, and `Payment`:
  1. `Listing` availability check → `Order.createFromListing` → `Payment.captureDirect` (immediate capture, no escrow)
  2. On success, marks the `Listing` sold (`Listing.markSold`)

## Service: SlotManagementService
- **Responsibilities**: Enforces `CommissionRuleSet`'s queue limit across active `CommissionRequest`/`Order` counts:
  1. On `CommissionRequest.submitRequest`, checks the shop's active (non-terminal) request+order count against `maxQueue`
  2. When the count reaches `maxQueue`, auto-transitions `CommissionRuleSet.setSlotState` to `closed`
  3. When an order reaches a terminal state (`Completed`/`Declined`), re-evaluates whether the shop can reopen (only if the seller had not manually closed/waitlisted independently)

## Service: WebhookHandlerService
- **Responsibilities**: Receives inbound Stripe webhook requests, verifies signatures, and delegates to `Payment.handleWebhookEvent`. This is the *only* entry point by which payment/order state is updated from Stripe — never from client-side confirmation (requirements.md NFR-4, SECURITY rules on webhook trust).
- **Idempotency**: Tracks processed Stripe event IDs to avoid double-processing retried webhook deliveries.

## Service: StatusBadgeSyncService
- **Responsibilities**: Listens for status transitions (`CommissionRequest`, `Order`) and new messages, and updates `StatusBadge`'s per-user unread indicators accordingly. Kept as a thin service rather than embedding badge-update calls throughout every component method, so the badge behavior (FR-8) can change independently of the core lifecycle logic.

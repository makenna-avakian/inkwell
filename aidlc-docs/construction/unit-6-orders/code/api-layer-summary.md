# API Layer Summary — Unit 6: Orders & Payments

## Server Actions
`src/app/orders/actions.ts` — `acceptAndCreateOrderAction`, `checkoutAction`, `onboardSellerActionAction`, `markInProgressAction`, `submitForReviewAction`, `requestRevisionAction`, `approveDeliveryAction`, `cancelOrderAction`, `getMyOrdersAsBuyerAction`, `getMyOrdersAsSellerAction`. All resolve the caller via `auth()`; the first three return a `checkoutUrl` (Stripe Checkout or Connect onboarding redirect) for the client to navigate to.

## Route Handler
`src/app/api/webhooks/stripe/route.ts` — `POST /api/webhooks/stripe`. Reads the raw request body (required for Stripe signature verification — never parsed as JSON first), verifies the `stripe-signature` header via `constructWebhookEvent`, then dispatches to `handleWebhookEvent`. Idempotency (BR-7) lives one layer down in the service, not in the route handler.

## Tests
- `actions.test.ts` — checkout-URL propagation, BR-2 error-message surfacing, unauthenticated-caller rejection, correct caller-id delegation.
- `api/webhooks/stripe/route.test.ts` — missing-signature rejection (400), signature-verification-failure rejection (400), successful dispatch to `handleWebhookEvent`.

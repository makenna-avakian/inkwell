# Frontend Components Summary — Unit 6: Orders & Payments

## Created
- `src/app/components/orders/OrderStatusPanel.tsx` (state-machine-aware controls, gated by caller role and `isCancellable`/status), `BuyNowButton.tsx`, `StripeOnboardingButton.tsx`, `MyOrders.tsx` (buyer), `SellerTransactions.tsx` (seller, shows platform-fee-net breakdown)
- `src/app/(seller)/shop/transactions/page.tsx`, `src/app/orders/page.tsx`, `src/app/checkout/success/page.tsx`, `src/app/checkout/cancelled/page.tsx`
- `src/app/orders/actions.ts` (Server Actions)

## Modified (Step 6 cross-unit integration)
- `src/app/components/requests/RequestActions.tsx` — Accept now calls `acceptAndCreateOrderAction` instead of Unit 5's bare accept. It refreshes the page (`router.refresh()`) rather than redirecting: the seller who clicks Accept isn't the one who pays, so there's nothing for their browser to redirect to.
- `src/app/components/requests/RequestDetail.tsx` — renders `OrderStatusPanel` once an Order exists for the request (`request.status === 'accepted'`).
- `src/app/components/discovery/PublicShopPage.tsx` — each "Available Now" listing now also renders `BuyNowButton` (or a sign-in prompt), alongside the existing `ListingCard` link-through.
- `src/app/(seller)/shop/page.tsx` — gains a "Payments" section rendering `StripeOnboardingButton`.

## Design addition beyond the original plan text: `getCheckoutUrlForOrder` / `payOrderAction`
frontend-components.md specified that `OrderStatusPanel` should offer a "Complete Payment" link to the Checkout Session for an unpaid Order — but the Checkout Session URL returned by `acceptAndCreateOrder` is only ever seen by the seller (who accepted, not who pays) at accept time, and isn't persisted on the `orders` row. Rather than add a column for an ephemeral, single-use Stripe URL, `getCheckoutUrlForOrder` (service) / `payOrderAction` (Server Action) regenerate it on demand using `createCheckoutSession`'s existing `${orderId}-checkout` idempotency key — the buyer gets the same underlying Stripe session if one is still valid, or a fresh one otherwise.

## Tests
`OrderStatusPanel.test.tsx` (role-gated controls, status transition after a successful action, Complete Payment shown/hidden by payment state), `BuyNowButton.test.tsx`, `StripeOnboardingButton.test.tsx` (connected vs. not-yet-connected), `RequestActions.test.tsx` (refresh-not-redirect on accept, BR-2 error surfacing, decline still works).

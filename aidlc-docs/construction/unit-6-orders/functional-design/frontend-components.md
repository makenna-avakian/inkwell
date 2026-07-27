# Frontend Components — Unit 6: Orders & Payments

**Scope note**: like Unit 5, this unit needs both personas' UI, and — because an Order is the continuation of a CommissionRequest's lifecycle — several components are embedded into or modify Units 2/4/5's existing pages rather than living on brand-new routes.

## Routes
```
src/app/(seller)/shop/transactions/page.tsx  -> <SellerTransactions />
src/app/orders/page.tsx                       -> <MyOrders />         (buyer)
src/app/checkout/success/page.tsx             -> confirmation page after Stripe Checkout redirect back
src/app/checkout/cancelled/page.tsx           -> shown if the buyer abandons Stripe Checkout
```

## Cross-Unit UI Integrations (modifications, not new pages)
- **Unit 5's `RequestDetail.tsx`**: when the request's status is `'accepted'` (an Order exists), also render `OrderStatusPanel` — shows Order status, seller's Mark In Progress/Submit for Review actions, buyer's Approve/Request Revision/Cancel actions, and (if payment isn't confirmed yet) a "Complete Payment" link to the Checkout Session. The Accept button (Unit 5's `RequestActions.tsx`) now calls the new `acceptAndCreateOrderAction` instead of Unit 5's bare accept action.
- **Unit 4's `PublicShopPage.tsx`**: each listing in "Available Now" gets a `BuyNowButton`, replacing the plain `ListingCard` link-through for the buy-now path.
- **Unit 2's `/shop` page**: gains a `StripeOnboardingButton` showing connection status, since BR-2 gates commission acceptance and buy-now listing on it.

## OrderStatusPanel
- **Props**: `orderId`.
- **Seller controls**: Mark In Progress, Submit for Review — shown only when `status` is `'accepted'`/`'in_progress'` respectively and the caller is the seller.
- **Buyer controls**: Approve Delivery, Request Revision (with feedback field), Cancel — shown only when applicable per the state machine and the caller is the buyer.

## BuyNowButton
- **Props**: `listingId`.
- **Interactions**: click → `checkoutAction` → redirect (`window.location.href`) to the returned Stripe Checkout Session URL.

## StripeOnboardingButton
- **Props**: `shopId`, `connected: boolean`.
- **Interactions**: click (if not connected) → `onboardSellerAction` → redirect to the returned Stripe Connect onboarding link.

## SellerTransactions / MyOrders
- List completed (and in-progress) orders with amount, platform fee, seller net, and status — the transaction-history stories (S-24, S-39).

## Automation-Friendly Attributes
`data-testid`s follow the established convention (e.g., `order-status-panel-approve-button`, `buy-now-button`, `stripe-onboarding-button`).

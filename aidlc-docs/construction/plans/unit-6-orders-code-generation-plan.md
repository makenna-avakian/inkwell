# Code Generation Plan — Unit 6: Orders & Payments

**Final unit of Phase 1.**

## Unit Context
- **Stories**: S-19..S-24 (seller), S-35..S-40 (buyer, incl. S-36 per unit-of-work-story-map.md's correction).
- **Dependencies**: Unit 1 (Auth), Unit 2 (`ShopProfile` schema addition, `setSlotStateRow` pattern reference), Unit 3 (`setListingStatus` reused for buy-now), Unit 5 (`acceptRequest` called by the new orchestration function; `RequestActions.tsx`/`RequestDetail.tsx` modified).
- **Database entities owned**: `orders`, `processed_webhook_events`. Schema addition: `shop_profiles.stripe_connect_account_id`.
- **Code organization**: `src/server/orders/`.

## Steps

- [x] **Step 1: Project Structure Setup** — add `stripe` npm dependency; add `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` to `.env.example`.
- [x] **Step 2: Database Schema & Migration** — add `orders`, `processed_webhook_events` to `schema.ts`; add `stripeConnectAccountId` to `shopProfiles`; `drizzle/0005_unit6_orders_schema.sql`.
- [x] **Step 3: Business Logic Generation** — `src/server/orders/payment.ts` (Stripe client, `computeFees`, `onboardSeller`, `createCheckoutSession`/`authorizeEscrow`/`captureDirect`, `captureAndRelease`, `cancelOrder` (void), `hasPayoutsEnabled`), `src/server/orders/repository.ts`, `src/server/orders/service.ts` (`acceptAndCreateOrder` — CommissionLifecycleService, `checkout` — CheckoutService, `markInProgress`, `submitForReview`, `requestRevision`, `approveDelivery`, `cancelOrder`, read paths).
- [x] **Step 4: Business Logic Unit + Property-Based Testing** — `computeFees` PBT, status-transition PBT, exactly-one-source validation PBT.
- [x] **Step 5: Business Logic Summary**.
- [x] **Step 6: Cross-Unit Integration** — (a) modify Unit 5's `RequestActions.tsx` to call the new `acceptAndCreateOrderAction` instead of Unit 5's bare accept action; (b) modify Unit 5's `RequestDetail.tsx` to render `OrderStatusPanel` when an Order exists; (c) modify Unit 4's `PublicShopPage.tsx` to render `BuyNowButton` per listing; (d) modify Unit 2's `/shop` page to render `StripeOnboardingButton`.
- [x] **Step 7: API Layer Generation** — Server Actions (`acceptAndCreateOrderAction`, `checkoutAction`, `onboardSellerAction`, `markInProgressAction`, `submitForReviewAction`, `requestRevisionAction`, `approveDeliveryAction`, `cancelOrderAction`) + the Stripe webhook Route Handler (`src/app/api/webhooks/stripe/route.ts`).
- [x] **Step 8: API Layer Unit Testing** — including webhook signature verification and idempotent-replay tests.
- [x] **Step 9: API Layer Summary**.
- [x] **Step 10: Repository Layer Unit Testing** — `describe.skipIf`, same pattern as prior units.
- [x] **Step 11: Repository Layer Summary**.
- [x] **Step 12: Frontend Components Generation** — `OrderStatusPanel.tsx`, `BuyNowButton.tsx`, `StripeOnboardingButton.tsx`, `SellerTransactions.tsx`, `MyOrders.tsx`; pages `src/app/(seller)/shop/transactions/page.tsx`, `src/app/orders/page.tsx`, `src/app/checkout/success/page.tsx`, `src/app/checkout/cancelled/page.tsx`.
- [x] **Step 13: Frontend Components Unit Testing**.
- [x] **Step 14: Frontend Components Summary**.
- [x] **Step 15: Database Migration Scripts** — finalize `drizzle/0005_unit6_orders_schema.sql`.
- [x] **Step 16: Documentation Generation** — README Current Status update (Phase 1 complete); note Stripe test-mode setup instructions.
- [x] **Step 17: Deployment Artifacts Generation** — none needed beyond Step 1's `.env.example` update (Stripe webhook registration is a manual Stripe Dashboard step, not IaC, per infrastructure-design.md).

This plan is the single source of truth for Unit 6 Code Generation — the final unit of Phase 1.

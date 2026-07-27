# Repository Layer Summary — Unit 6: Orders & Payments

## File
`src/server/orders/repository.ts` — Drizzle queries for `orders` and `processed_webhook_events`, plus `getShopStripeAccountId`/`setShopStripeAccountId` on `shop_profiles` (the Unit 2 table this unit extends).

## Tests
`repository.test.ts` — integration tests, `describe.skipIf(!process.env.DATABASE_URL)`. Covers: create/read round-trip for `orders`, `updateOrderRow` correctly bumps `status`/`updatedAt`, `markEventProcessed` idempotency backed by the DB unique constraint (BR-7, not just application logic), and the `shop_profiles.stripe_connect_account_id` round-trip.

`drizzle/0005_unit6_orders_schema.sql` is illustrative, same caveat as prior units.

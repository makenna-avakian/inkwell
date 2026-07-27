-- Illustrative migration for Unit 6 (Orders & Payments) — final unit of Phase 1.
-- As with prior migrations, run `npm run db:generate` against a real
-- DATABASE_URL for the authoritative migration.

ALTER TABLE "shop_profiles" ADD COLUMN IF NOT EXISTS "stripe_connect_account_id" text;

CREATE TABLE IF NOT EXISTS "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid REFERENCES "commission_requests"("id"),
	"listing_id" uuid REFERENCES "listings"("id"),
	"buyer_id" uuid NOT NULL REFERENCES "users"("id"),
	"seller_id" uuid NOT NULL REFERENCES "users"("id"),
	"subtotal_cents" integer NOT NULL,
	"platform_fee_cents" integer NOT NULL,
	"seller_net_cents" integer NOT NULL,
	"status" text DEFAULT 'accepted' NOT NULL,
	"stripe_payment_intent_id" text,
	"stripe_transfer_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "processed_webhook_events" (
	"stripe_event_id" text PRIMARY KEY,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "orders_buyer_id_idx" ON "orders" ("buyer_id");
CREATE INDEX IF NOT EXISTS "orders_seller_id_idx" ON "orders" ("seller_id");
CREATE UNIQUE INDEX IF NOT EXISTS "orders_request_id_unique_idx" ON "orders" ("request_id") WHERE "request_id" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "orders_listing_id_unique_idx" ON "orders" ("listing_id") WHERE "listing_id" IS NOT NULL;

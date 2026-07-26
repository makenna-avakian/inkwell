-- Illustrative migration for Unit 5 (Commission Requests & Messaging).
-- As with prior migrations, run `npm run db:generate` against a real
-- DATABASE_URL for the authoritative migration.

CREATE TABLE IF NOT EXISTS "commission_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL REFERENCES "shop_profiles"("id") ON DELETE CASCADE,
	"buyer_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"rule_version_id" uuid NOT NULL REFERENCES "commission_rule_versions"("id"),
	"tier_id" text NOT NULL,
	"add_on_ids" jsonb DEFAULT '[]' NOT NULL,
	"description" text NOT NULL,
	"reference_image_urls" jsonb DEFAULT '[]' NOT NULL,
	"budget_cents" integer,
	"deadline_preference" text,
	"status" text DEFAULT 'requested' NOT NULL,
	"decline_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"responded_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "waitlist_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL REFERENCES "shop_profiles"("id") ON DELETE CASCADE,
	"buyer_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "waitlist_entries_shop_id_buyer_id_unique" UNIQUE("shop_id","buyer_id")
);

CREATE TABLE IF NOT EXISTS "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL REFERENCES "commission_requests"("id") ON DELETE CASCADE,
	"sender_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"body" text NOT NULL,
	"attachment_urls" jsonb DEFAULT '[]' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "request_read_receipts" (
	"request_id" uuid NOT NULL REFERENCES "commission_requests"("id") ON DELETE CASCADE,
	"user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"last_read_at" timestamp with time zone DEFAULT now() NOT NULL,
	PRIMARY KEY ("request_id", "user_id")
);

CREATE INDEX IF NOT EXISTS "commission_requests_shop_id_status_idx" ON "commission_requests" ("shop_id", "status");
CREATE INDEX IF NOT EXISTS "commission_requests_buyer_id_idx" ON "commission_requests" ("buyer_id");
CREATE INDEX IF NOT EXISTS "messages_request_id_created_at_idx" ON "messages" ("request_id", "created_at");

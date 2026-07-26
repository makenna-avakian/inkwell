-- Illustrative migration for Unit 2 (Shops & Commission Rules) schema.
-- As with 0000_unit1_auth_schema.sql, the authoritative migration must be
-- generated via `npm run db:generate` against a real DATABASE_URL.

CREATE TABLE IF NOT EXISTS "shop_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
	"banner_image_url" text,
	"avatar_image_url" text,
	"bio" text,
	"social_links" jsonb DEFAULT '[]' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "portfolio_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL REFERENCES "shop_profiles"("id") ON DELETE CASCADE,
	"image_url" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "commission_rule_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL REFERENCES "shop_profiles"("id") ON DELETE CASCADE,
	"version" integer NOT NULL,
	"tiers" jsonb NOT NULL,
	"add_ons" jsonb NOT NULL,
	"rules_content" jsonb NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "shop_commission_settings" (
	"shop_id" uuid PRIMARY KEY REFERENCES "shop_profiles"("id") ON DELETE CASCADE,
	"current_version_id" uuid REFERENCES "commission_rule_versions"("id"),
	"slot_state" text DEFAULT 'closed' NOT NULL,
	"max_queue" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "portfolio_images_shop_id_position_idx" ON "portfolio_images" ("shop_id", "position");
CREATE UNIQUE INDEX IF NOT EXISTS "commission_rule_versions_shop_id_version_idx" ON "commission_rule_versions" ("shop_id", "version");

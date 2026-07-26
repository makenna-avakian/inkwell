-- Illustrative migration for Unit 3 (Listings) schema.
-- As with 0000/0001, run `npm run db:generate` against a real DATABASE_URL
-- for the authoritative migration.

CREATE TABLE IF NOT EXISTS "listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL REFERENCES "shop_profiles"("id") ON DELETE CASCADE,
	"title" text NOT NULL,
	"description" text,
	"price_cents" integer NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "listing_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL REFERENCES "listings"("id") ON DELETE CASCADE,
	"image_url" text NOT NULL,
	"position" integer NOT NULL
);

CREATE INDEX IF NOT EXISTS "listings_shop_id_status_idx" ON "listings" ("shop_id", "status");
CREATE INDEX IF NOT EXISTS "listing_images_listing_id_position_idx" ON "listing_images" ("listing_id", "position");

-- Illustrative migration for Unit 4 (Browse & Discovery).
-- As with prior migrations, run `npm run db:generate` against a real
-- DATABASE_URL for the authoritative migration.

ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "medium" text;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "style_tags" jsonb DEFAULT '[]' NOT NULL;

CREATE INDEX IF NOT EXISTS "listings_medium_idx" ON "listings" ("medium");
CREATE INDEX IF NOT EXISTS "listings_style_tags_gin_idx" ON "listings" USING GIN ("style_tags");
CREATE INDEX IF NOT EXISTS "shop_profiles_bio_fts_idx" ON "shop_profiles" USING GIN (to_tsvector('english', coalesce("bio", '')));

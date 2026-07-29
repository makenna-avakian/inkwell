ALTER TABLE "portfolio_images" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "portfolio_images" ADD COLUMN "caption" text;--> statement-breakpoint
ALTER TABLE "portfolio_images" ADD COLUMN "tags" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "portfolio_images" ADD COLUMN "listing_id" uuid;--> statement-breakpoint
ALTER TABLE "portfolio_images" ADD COLUMN "featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "portfolio_images" ADD CONSTRAINT "portfolio_images_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

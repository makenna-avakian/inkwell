CREATE TABLE IF NOT EXISTS "gallery_wall_settings" (
	"shop_id" uuid PRIMARY KEY NOT NULL,
	"frame_color" text DEFAULT 'black' NOT NULL,
	"frame_style" text DEFAULT 'classic' NOT NULL,
	"pieces" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gallery_wall_settings" ADD CONSTRAINT "gallery_wall_settings_shop_id_shop_profiles_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shop_profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

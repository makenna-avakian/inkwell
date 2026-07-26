# Logical Components — Unit 3: Listings

## Components Needed
- Postgres tables: `listings`, `listing_images` (per domain-entities.md), in the shared Neon database.
- No new R2 bucket — images live in the same `inkwell-media` bucket under a `shops/{shopId}/listings/{listingId}/...` key path (finalized at Infrastructure Design).

## Components Explicitly Not Needed
Same as Units 1/2: no cache, no queue, no CDN beyond `next/image` — no new justification needed since nothing new is introduced.

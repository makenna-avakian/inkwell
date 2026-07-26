# Infrastructure Design — Unit 3: Listings

No new infrastructure — see [shared-infrastructure.md](../../shared-infrastructure.md).

## Storage
- `listings`, `listing_images` tables in the shared Neon database.
- Images in the existing `inkwell-media` R2 bucket, object keys: `{environment}/shops/{shopId}/listings/{listingId}/{imageId}.{ext}`.

## Compute / Networking / Monitoring
Identical to Unit 2 — same app, same custom domain for public reads, same Sentry error tracking.

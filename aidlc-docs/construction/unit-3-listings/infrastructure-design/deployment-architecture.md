# Deployment Architecture — Unit 3: Listings

Identical to Unit 2's deployment architecture (same app, same R2 bucket, same upload sequence pattern) — see [unit-2-shops/infrastructure-design/deployment-architecture.md](../../unit-2-shops/infrastructure-design/deployment-architecture.md). No new diagram needed; the only difference is the object key path (`shops/{shopId}/listings/{listingId}/...` instead of `shops/{shopId}/{imageId}...`).

## Rollback Path
Same as Units 1/2 — code-only rollback is sufficient (no destructive migrations in this unit).

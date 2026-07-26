# Deployment Architecture — Unit 4: Browse & Discovery

Identical to Units 1-3's deployment (same app, same Neon database, same CI/CD). No new diagram — the only change is the additional migration for `listings.medium`/`listings.style_tags` and new indexes.

## Rollback Path
Code-only rollback remains sufficient (adding nullable columns and indexes is non-destructive and backward-compatible with the previous deployment).

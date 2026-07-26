# NFR Design Patterns — Unit 4: Browse & Discovery

No new resiliency process questions — all resolved at Unit 1. No new external dependency (Postgres only, same instance as Units 1-3).

## Resilience Patterns
- Same 5s timeout / one-retry convention on all Postgres queries as Units 1-3.
- Fail-safe default: an invalid/malformed filter or search query parameter is ignored (falls back to the unfiltered feed) rather than raising a 500 error — a buyer fumbling a URL query string should never see a crash.

## Performance Patterns (meeting the 500ms target, NFR Requirements)
- Indexes: `listings(shop_id, status)` (already exists from Unit 3), new `listings(medium)`, GIN index on `listings.style_tags`, GIN index on the computed search `tsvector` expression (finalized at Infrastructure Design).
- No N+1 queries: `browseFeed` joins shops/settings/first-image in a single query rather than querying per-listing.

## Security Patterns
- SECURITY-05: all filter/search inputs (medium, style tags, price range, query string, page number) validated via Zod before reaching the query layer — malformed input (e.g., non-numeric page) is rejected with a safe default, never passed raw into a query.

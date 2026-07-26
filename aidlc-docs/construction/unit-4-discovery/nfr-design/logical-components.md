# Logical Components — Unit 4: Browse & Discovery

## Components Needed
- No new tables. Schema addition: `Listing.medium`, `Listing.styleTags` (modifies Unit 3's table).
- New indexes on the existing `listings` table (see nfr-design-patterns.md) — finalized at Infrastructure Design/Code Generation.

## Components Explicitly Not Needed
- No cache/CDN layer (Question 2 of NFR Requirements: always-fresh rendering).
- No search service (Elasticsearch, Algolia, etc.) — Postgres full-text search is sufficient at Phase 1 scale (NFR Requirements tech-stack-decisions.md).

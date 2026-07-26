# Logical Components — Unit 2: Shops & Commission Rules

## Components Needed
- Postgres tables: `shop_profiles`, `portfolio_images`, `commission_rule_versions`, `shop_commission_settings` (per domain-entities.md), in the same Neon database as Unit 1's tables.
- Cloudflare R2 bucket for banner/avatar/portfolio images (Infrastructure Design finalizes bucket naming/config).

## Components Explicitly Not Needed (and why)
- **CDN in front of R2**: `next/image` already provides caching/optimization at the Vercel edge (Question 2: A) — no additional CDN layer needed for Phase 1.
- **Image processing service/queue**: no resize-on-upload pipeline (Question 2: A) — nothing async to queue.
- **Cache (Redis)**: shop/rules reads are simple indexed Postgres queries; no evidence of a need for a cache layer at this scale.

## Integration Pattern
- `src/server/shops/` calls the shared Neon Postgres client (`src/server/db/client.ts`, from Unit 1) for all shop/rules data, and a new `src/server/shops/storage.ts` for R2 presigned-URL generation — no new database client, no new compute service.

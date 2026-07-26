# Repository Layer Summary — Unit 2: Shops & Commission Rules

## File
- `src/server/shops/repository.ts` — Drizzle queries for `shop_profiles`, `portfolio_images`, `commission_rule_versions`, `shop_commission_settings`.

## Tests
- `repository.test.ts` — integration tests against a real Postgres instance, `describe.skipIf(!process.env.DATABASE_URL)`, same pattern as Unit 1. Covers: shop creation (with accompanying settings row), portfolio image position ordering, and append-only rule versioning (old versions remain readable and unmutated after a new one is published, per BR-4).

## Notes
- `drizzle/0001_unit2_shops_schema.sql` is illustrative, same caveat as Unit 1's migration — `npm run db:generate` must be run against a real Neon `DATABASE_URL` for the authoritative migration.

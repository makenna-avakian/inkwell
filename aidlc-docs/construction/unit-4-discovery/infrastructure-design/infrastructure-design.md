# Infrastructure Design — Unit 4: Browse & Discovery

No new infrastructure — see [shared-infrastructure.md](../../shared-infrastructure.md).

## Storage
- Schema migration adds `medium`/`style_tags` to the existing `listings` table.
- New indexes (finalized in Code Generation's migration):
  - `CREATE INDEX ON listings (medium)`
  - `CREATE INDEX ON listings USING GIN (style_tags)`
  - `CREATE INDEX ON shop_profiles USING GIN (to_tsvector('english', coalesce(bio, '')))` — partial full-text index; combined with `users.display_name` at query time (a cross-table generated tsvector isn't possible, per functional-design/business-logic-model.md).

## Compute / Networking / Monitoring
Identical to Units 1-3 — same app, same Sentry error tracking. No new environment variables.

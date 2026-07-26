# NFR Requirements — Unit 4: Browse & Discovery

## Performance
- **Target** (Question 1: A): p95 < 500ms server-render time for the browse feed and shop page.
- Achieved primarily through proper indexing: `listings(status, medium)`, GIN index on `styleTags`, and the full-text search GIN index (finalized at Infrastructure Design/Code Generation) — not through caching (see below).

## Scalability
- Offset pagination (Question 3 of Functional Design: A) at 24 items/page keeps individual query result sets small regardless of total catalog size.

## Availability
- Inherits project-wide single-region multi-zone / Backup & Restore DR. No unit-specific override.

## Reliability
- **Caching** (Question 2: A): always fresh, no ISR — buyers never see stale slot-state or listing availability. Revisit if Phase 1 traffic ever makes this a real DB-load concern (the 500ms target above already assumes no cache).

## Security
- BR-1 (read-only, no auth) means this unit has no new SECURITY-08 (authorization) surface — the main applicable rule is SECURITY-05 (input validation on filter/search query parameters, to prevent malformed input from reaching the database layer).

## Maintainability
- `medium`/`styleTags` are freeform text/tags for Phase 1 (no controlled vocabulary/taxonomy) — simplest to ship, though it means filter values are whatever sellers type. Acceptable given Phase 1 scale; a controlled taxonomy would be a Phase 2 enhancement, not blocking now.

## Tech Stack Selection
See [tech-stack-decisions.md](tech-stack-decisions.md).

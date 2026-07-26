# NFR Requirements — Unit 5: Commission Requests & Messaging

## Reliability / UX
- **Messaging** (Question 1: B): client-side polling every 10s while a `RequestDetail` page is open — no new infrastructure, bounded request volume (only active viewers poll, and only while their tab is open).

## Performance
- No new hard target beyond the project-wide 5s timeout/one-retry convention on Postgres queries — request submission/message posting are not the primary buyer-facing discovery path (that's Unit 4's 500ms target).

## Security
- SECURITY-05: request submission and message posting both validated via Zod (tier/add-on ids, budget as a positive integer, message body non-empty/length-capped).
- SECURITY-08: reused object-level auth pattern (buyer-or-shop-owner) from Units 2/3's `assertOwner`-style checks.

## Availability
- Inherits project-wide single-region multi-zone / Backup & Restore DR.

## Tech Stack Selection
See [tech-stack-decisions.md](tech-stack-decisions.md).

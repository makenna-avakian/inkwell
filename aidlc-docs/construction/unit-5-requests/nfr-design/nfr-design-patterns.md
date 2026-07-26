# NFR Design Patterns — Unit 5: Commission Requests & Messaging

No new resiliency process questions (all resolved at Unit 1) and no new external dependency.

## Resilience Patterns
- Same 5s timeout / one-retry convention on Postgres queries as prior units.
- Fail-safe defaults: `submitRequest` against a shop with no published rules, or a `'closed'` shop, is rejected with a clear validation error (BR-1) rather than silently accepted or crashing.

## Performance Patterns
- Polling (Question 1: B) is client-only — a `setInterval`-driven re-fetch in `MessageThread`, cleaned up on unmount. No server-side change beyond the existing `getRequest`/message-list read path.

## Security Patterns
- Object-level auth (BR-2) reused from the same pattern as Units 2/3's `assertOwner`.
- Reference image uploads reuse Unit 2's validated presigned-upload flow — no new validation logic to keep in sync.

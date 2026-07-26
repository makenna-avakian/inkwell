# Logical Components — Unit 5: Commission Requests & Messaging

## Components Needed
- Postgres tables: `commission_requests`, `waitlist_entries`, `messages`, `request_read_receipts` (per domain-entities.md), in the shared Neon database.
- Reference images: same `inkwell-media` R2 bucket, new key path `shops/{shopId}/requests/{requestId}/...`.

## Components Explicitly Not Needed
- No WebSocket/SSE service (Question 1: B chose polling over real-time push).
- No queue/cache — same rationale as prior units at Phase 1 scale.

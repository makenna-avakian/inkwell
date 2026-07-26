# NFR Requirements Plan — Unit 5: Commission Requests & Messaging

Reuses Units 1-4's Postgres/R2/timeout conventions directly — one new question genuinely specific to messaging.

## Execution Checklist

- [x] Resolve Question 1 (message thread real-time behavior) — B (polling)
- [x] Generate `aidlc-docs/construction/unit-5-requests/nfr-requirements/nfr-requirements.md`
- [x] Generate `aidlc-docs/construction/unit-5-requests/nfr-requirements/tech-stack-decisions.md`

## Questions

## Question 1: Message Thread Real-Time Behavior
Should a request's message thread update live (without a manual refresh), or is refresh-to-see-new-messages acceptable for Phase 1?

A) Refresh-based — no polling, no websockets; the buyer/seller reloads or navigates back to see new messages. Simplest, no new infrastructure.

B) Polling — the client re-fetches the thread every N seconds while the page is open. No new infrastructure (still plain HTTP), some extra request volume.

C) Real-time via WebSockets/SSE — needs a new persistent-connection mechanism (e.g., a third-party realtime service, since Vercel serverless functions don't hold long-lived connections) — real infrastructure addition.

X) Other (please describe after [Answer]: tag below)

[Answer]: b

# Business Logic Summary — Unit 5: Commission Requests & Messaging

## Files
- `src/server/requests/logic.ts` — pure predicates: `isValidTierAndAddOnSelection` (BR-1), `shouldAutoClose` (BR-6), `isUnread` (BR-7).
- `src/server/requests/repository.ts` — Drizzle queries for all 4 tables; `joinWaitlistRow` and `upsertReadReceipt` use `onConflictDoNothing`/`onConflictDoUpdate` for idempotency at the DB level, not just application logic.
- `src/server/requests/service.ts` — submitRequest, joinWaitlist, acceptRequest/declineRequest, postMessage, markRequestSeen, getUnreadSummary, enforceQueueLimit (SlotManagementService).

## Notable Design Decision
`enforceQueueLimit` calls Unit 2's `setSlotStateRow` **repository** function directly, not its auth-gated `setSlotState` **service** function — because this is a system-triggered action (no signed-in caller to check ownership against). Documented inline in `service.ts` to avoid this reading as a security bypass.

## Tests
- `logic.test.ts` — PBT-01 for all three pure functions.
- `service.test.ts` — example-based: rule-set validation rejections, queue auto-close threshold, waitlist idempotency (repository-level), ownership checks on accept/decline, required decline reason.

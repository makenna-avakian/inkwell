# Code Generation Plan — Unit 5: Commission Requests & Messaging

## Unit Context
- **Stories**: S-15..S-19 (seller), S-30..S-34 (buyer). S-36 excluded per unit-of-work-story-map.md (belongs to Unit 6).
- **Dependencies**: Unit 1 (Auth), Unit 2 (`getPublishedRuleSet`, `setSlotState` reused directly), Unit 4 (`PublicShopPage` modified to embed the request form/waitlist button).
- **Database entities owned**: `commission_requests`, `waitlist_entries`, `messages`, `request_read_receipts`.
- **Code organization**: `src/server/requests/`.

## Steps

- [x] **Step 1: Project Structure Setup** — no new dependencies.
- [x] **Step 2: Database Schema & Migration** — add 4 tables to `schema.ts`; `drizzle/0004_unit5_requests_schema.sql`.
- [x] **Step 3: Business Logic Generation** — `src/server/requests/repository.ts`, `src/server/requests/service.ts` (submitRequest, joinWaitlist, acceptRequest, declineRequest, postMessage, markRequestSeen, getUnreadSummary, enforceQueueLimit).
- [x] **Step 4: Business Logic Unit + Property-Based Testing** — PBT for tier/add-on validation, queue auto-close, unread computation, waitlist idempotency.
- [x] **Step 5: Business Logic Summary**.
- [x] **Step 6: Cross-Unit Integration (Unit 4 extension)** — modify `PublicShopPage.tsx` to render `CommissionRequestForm`/`WaitlistJoinButton` based on `publishedRules.slotState`.
- [x] **Step 7: API Layer Generation** — Server Actions for submit/join/accept/decline/postMessage/markSeen.
- [x] **Step 8: API Layer Unit Testing**.
- [x] **Step 9: API Layer Summary**.
- [x] **Step 10: Repository Layer Unit Testing** — `describe.skipIf`, same pattern as prior units.
- [x] **Step 11: Repository Layer Summary**.
- [x] **Step 12: Frontend Components Generation** — `CommissionRequestForm.tsx`, `WaitlistJoinButton.tsx`, `RequestInbox.tsx`, `MyRequests.tsx`, `RequestDetail.tsx`, `MessageThread.tsx`, `StatusBadgeIndicator.tsx`; pages `src/app/(seller)/shop/requests/page.tsx` + `[id]/page.tsx`, `src/app/requests/page.tsx` + `[id]/page.tsx`.
- [x] **Step 13: Frontend Components Unit Testing**.
- [x] **Step 14: Frontend Components Summary**.
- [x] **Step 15: Database Migration Scripts** — finalize `drizzle/0004_unit5_requests_schema.sql`.
- [x] **Step 16: Documentation Generation** — README Current Status update.
- [x] **Step 17: Deployment Artifacts Generation** — none needed.

This plan is the single source of truth for Unit 5 Code Generation.

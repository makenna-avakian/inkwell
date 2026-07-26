# Code Generation Plan — Unit 5: Commission Requests & Messaging

## Unit Context
- **Stories**: S-15..S-19 (seller), S-30..S-34 (buyer). S-36 excluded per unit-of-work-story-map.md (belongs to Unit 6).
- **Dependencies**: Unit 1 (Auth), Unit 2 (`getPublishedRuleSet`, `setSlotState` reused directly), Unit 4 (`PublicShopPage` modified to embed the request form/waitlist button).
- **Database entities owned**: `commission_requests`, `waitlist_entries`, `messages`, `request_read_receipts`.
- **Code organization**: `src/server/requests/`.

## Steps

- [ ] **Step 1: Project Structure Setup** — no new dependencies.
- [ ] **Step 2: Database Schema & Migration** — add 4 tables to `schema.ts`; `drizzle/0004_unit5_requests_schema.sql`.
- [ ] **Step 3: Business Logic Generation** — `src/server/requests/repository.ts`, `src/server/requests/service.ts` (submitRequest, joinWaitlist, acceptRequest, declineRequest, postMessage, markRequestSeen, getUnreadSummary, enforceQueueLimit).
- [ ] **Step 4: Business Logic Unit + Property-Based Testing** — PBT for tier/add-on validation, queue auto-close, unread computation, waitlist idempotency.
- [ ] **Step 5: Business Logic Summary**.
- [ ] **Step 6: Cross-Unit Integration (Unit 4 extension)** — modify `PublicShopPage.tsx` to render `CommissionRequestForm`/`WaitlistJoinButton` based on `publishedRules.slotState`.
- [ ] **Step 7: API Layer Generation** — Server Actions for submit/join/accept/decline/postMessage/markSeen.
- [ ] **Step 8: API Layer Unit Testing**.
- [ ] **Step 9: API Layer Summary**.
- [ ] **Step 10: Repository Layer Unit Testing** — `describe.skipIf`, same pattern as prior units.
- [ ] **Step 11: Repository Layer Summary**.
- [ ] **Step 12: Frontend Components Generation** — `CommissionRequestForm.tsx`, `WaitlistJoinButton.tsx`, `RequestInbox.tsx`, `MyRequests.tsx`, `RequestDetail.tsx`, `MessageThread.tsx`, `StatusBadgeIndicator.tsx`; pages `src/app/(seller)/shop/requests/page.tsx` + `[id]/page.tsx`, `src/app/requests/page.tsx` + `[id]/page.tsx`.
- [ ] **Step 13: Frontend Components Unit Testing**.
- [ ] **Step 14: Frontend Components Summary**.
- [ ] **Step 15: Database Migration Scripts** — finalize `drizzle/0004_unit5_requests_schema.sql`.
- [ ] **Step 16: Documentation Generation** — README Current Status update.
- [ ] **Step 17: Deployment Artifacts Generation** — none needed.

This plan is the single source of truth for Unit 5 Code Generation.

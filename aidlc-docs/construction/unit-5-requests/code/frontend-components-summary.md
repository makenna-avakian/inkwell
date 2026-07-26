# Frontend Components Summary — Unit 5: Commission Requests & Messaging

## Created
- `src/app/components/requests/CommissionRequestForm.tsx`, `WaitlistJoinButton.tsx`, `MessageThread.tsx` (client-side polling per NFR Requirements Question 1: B), `RequestActions.tsx`, `RequestList.tsx` (shared), `RequestInbox.tsx`, `MyRequests.tsx`, `RequestDetail.tsx` (role-aware, shared by both seller and buyer routes), `StatusBadgeIndicator.tsx`
- `src/app/(seller)/shop/requests/page.tsx` + `[id]/page.tsx`, `src/app/requests/page.tsx` + `[id]/page.tsx`
- `src/app/requests/actions.ts` (Server Actions, including `getMessagesAction` for polling)

## Modified (Step 6 cross-unit integration)
- `src/app/components/discovery/PublicShopPage.tsx` — now renders `CommissionRequestForm` (slot open), `WaitlistJoinButton` (slot waitlist), or a "not accepting commissions" message (slot closed), with a sign-in prompt for signed-out visitors.

## Tests
`CommissionRequestForm.test.tsx`, `WaitlistJoinButton.test.tsx` (success + failure), `MessageThread.test.tsx` (send + polling, using fake timers), `RequestList.test.tsx` (empty state + unread-indicator placement).

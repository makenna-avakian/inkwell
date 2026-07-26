# Business Logic Model — Unit 5: Commission Requests & Messaging

## ⚠️ Forward Dependency: Accept → Order Creation (Unit 6)
`acceptRequest` in this unit only transitions `CommissionRequest.status` to `'accepted'`. Per `component-dependency.md`, `CommissionLifecycleService` (Unit 6) is what actually creates the `Order` and authorizes escrow on acceptance — Unit 6 doesn't exist yet. When Unit 6 lands, it will hook into this same transition (calling `acceptRequest`, then immediately calling its own `Order.createFromRequest`) rather than this unit reaching forward into Unit 6. Same resolution pattern as Unit 1→2's `isSeller`.

## submitRequest(buyerId, shopId, tierId, addOnIds, description, referenceImageUrls, budgetCents, deadlinePreference)
1. Load the shop's published rule set (Unit 2's `getPublishedRuleSet`, reused). Reject if none published yet, or if `slotState !== 'open'` (a `'waitlist'` shop routes buyers to `joinWaitlist` instead; `'closed'` rejects entirely).
2. Validate `tierId` exists in the published version's `tiers`, and every id in `addOnIds` exists in its `addOns` (BR-1 — "a buyer cannot submit a request that violates stated terms," requirements.md FR-4).
3. Insert `CommissionRequest` with `ruleVersionId` pinned to the currently published version's `id`.
4. Call `enforceQueueLimit(shopId)` (SlotManagementService) — if the shop has a `maxQueue` and the count of `'requested'`-status requests now meets or exceeds it, auto-transition `ShopCommissionSettings.slotState` to `'closed'` (Unit 2's `setSlotState`, reused — no new version created, per Unit 2's BR-6).

## joinWaitlist(buyerId, shopId)
1. Reject if `slotState !== 'waitlist'`.
2. Idempotent insert (Question 1: A) — a second join for the same `(shopId, buyerId)` is a no-op, not an error, enforced by the unique constraint (domain-entities.md) with an upsert-or-ignore.

## acceptRequest(requestId, callerId)
1. Caller must be the shop's owner (object-level auth).
2. `status` must currently be `'requested'`.
3. Set `status = 'accepted'`, `respondedAt = now()`.
4. **Does not** create an Order or touch payment — see forward-dependency note above.

## declineRequest(requestId, callerId, reason)
1. Caller must be the shop's owner.
2. `reason` required, non-empty (Question 4: A).
3. `status` must currently be `'requested'`.
4. Set `status = 'declined'`, `declineReason = reason`, `respondedAt = now()`.

## postMessage(requestId, senderId, body, attachmentUrls)
1. `senderId` must be either the request's `buyerId` or the shop's owner (object-level auth — a message thread is private to its two participants).
2. Insert `Message`.
3. Does **not** update the sender's own `RequestReadReceipt` (they've obviously seen their own message) but leaves the recipient's receipt stale, so the recipient sees an unread indicator (StatusBadgeSyncService's role, realized here as a simple side-effect-free read: unread is always computed from `Message.createdAt` vs `RequestReadReceipt.lastReadAt`, never a separately-maintained counter that could drift — Unit 1's BR-8 "single source of truth" philosophy applied here too).

## markRequestSeen(requestId, userId)
Upserts `RequestReadReceipt.lastReadAt = now()` for `(requestId, userId)`.

## getUnreadSummary(userId)
For every `CommissionRequest` where `userId` is the buyer or the shop's owner, compute `isUnread = lastReadAt IS NULL OR lastReadAt < latestActivity`, where `latestActivity = max(message.createdAt, request.respondedAt)`.

## SlotManagementService: enforceQueueLimit(shopId)
- Counts `CommissionRequest` rows with `status = 'requested'` for the shop (Question 2: A — only `'requested'` counts; once accepted, a request stops occupying this unit's own queue check, an intentional interim simplification until Unit 6 adds proper capacity tracking around Order completion).
- If `maxQueue` is set and the count `>= maxQueue`, auto-closes the shop (`slotState = 'closed'`).
- **One-directional**: this service only ever closes a shop automatically; reopening remains a manual seller action (Unit 2's `setSlotState`), consistent with the proposal's "auto-close when queue full" language, which never described automatic reopening.

## Read Paths (used by Unit 6 later)
- `getRequest(requestId, callerId)` — object-level auth: only the buyer or the shop's owner may view it.
- Unit 6's `Order.createFromRequest` will read `CommissionRequest.ruleVersionId`/`tierId`/`addOnIds` to compute the order amount, once it exists.

# Business Rules — Unit 5: Commission Requests & Messaging

## BR-1: Requests Must Match Published Rules
A request is rejected unless: the shop has a published rule set, `slotState === 'open'`, the requested `tierId` exists in that rule set's tiers, and every `addOnIds` entry exists in its add-ons. Matches requirements.md FR-4's "buyers can't submit requests that violate stated terms."

## BR-2: Object-Level Authorization
- `submitRequest`/`joinWaitlist`: any signed-in user (any buyer).
- `acceptRequest`/`declineRequest`: shop owner only.
- `postMessage`/`getRequest`/`markRequestSeen`: either the request's buyer or the shop's owner — no one else may view or post in a thread.

## BR-3: Waitlist Idempotency (Question 1: A)
Joining a waitlist a user is already on is a no-op — enforced by a unique `(shopId, buyerId)` constraint plus an upsert-or-ignore at the application layer (defense in depth, not just an application-level check).

## BR-4: Decline Reason Required (Question 4: A)
`declineRequest` rejects an empty/whitespace-only reason.

## BR-5: Rule Version Pinning
`CommissionRequest.ruleVersionId` is set once, at submission, and never changes — even if the shop publishes a new rule version afterward, this request's terms remain whatever was published at the moment of submission (requirements.md's core versioning promise, now actually consumed by this unit).

## BR-6: Queue Auto-Close Is One-Directional
`enforceQueueLimit` only ever closes a shop automatically; it never reopens one. Reopening is always a manual seller action via Unit 2's `setSlotState`.

## BR-7: Unread Status Is Computed, Not Stored
Per Unit 1's BR-8 "single source of truth" philosophy, "unread" is always derived by comparing `RequestReadReceipt.lastReadAt` against actual message/status timestamps — never a separately incremented/decremented counter that could drift out of sync.

---

## PBT-01: Testable Properties

| Component/Function | Property Category | Property |
|---|---|---|
| BR-1 tier/add-on validation | Invariant | For any generated rule version and any requested `tierId`/`addOnIds`, validation accepts if and only if every referenced id exists in that version's `tiers`/`addOns` arrays |
| `enforceQueueLimit` | Invariant | For any generated count of `'requested'` rows and any `maxQueue`, the shop is auto-closed if and only if `count >= maxQueue` (when `maxQueue` is set) — verified never to reopen a shop |
| Unread computation (BR-7) | Invariant | For any generated `lastReadAt` and `latestActivity` timestamps, `isUnread` is true if and only if `lastReadAt` is null or strictly before `latestActivity` |
| Waitlist idempotency (BR-3) | Invariant | Joining the same `(shopId, buyerId)` any number of times in sequence always results in exactly one `WaitlistEntry` row |

No components lack identifiable properties — CRUD happy paths (submitRequest's insert, postMessage's insert) are covered by example-based tests only (PBT-10).

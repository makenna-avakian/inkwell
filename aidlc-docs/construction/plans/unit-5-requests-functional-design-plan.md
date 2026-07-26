# Functional Design Plan — Unit 5: Commission Requests & Messaging

Source: [unit-of-work.md](../../inception/application-design/unit-of-work.md) (Unit 5), [components.md](../../inception/application-design/components.md) (CommissionRequest, StatusBadge, StatusBadgeSyncService, SlotManagementService), stories S-15..S-19 (seller), S-30..S-34, S-36 (buyer, per unit-of-work-story-map.md's note that S-36 actually belongs to Unit 6).

## ⚠️ Forward Dependency: Order/Payment Doesn't Exist Yet
Per `component-dependency.md`, accepting a request should create an `Order` and authorize escrow (`CommissionLifecycleService`, Unit 6 — not built yet). This unit can only transition `CommissionRequest.status` to `'Accepted'`; Unit 6 will hook into that transition to create the Order and trigger payment when it lands, the same way Unit 2 resolved Unit 1's `isSeller` forward reference. Documented here, not silently worked around.

## Execution Checklist

- [x] Resolve Question 1 (waitlist dedup) — A
- [x] Resolve Question 2 (active-request definition for queue-limit counting) — A
- [x] Resolve Question 3 (StatusBadge granularity) — A
- [x] Resolve Question 4 (decline reason: required or optional) — A
- [x] Generate `aidlc-docs/construction/unit-5-requests/functional-design/business-logic-model.md`
- [x] Generate `aidlc-docs/construction/unit-5-requests/functional-design/business-rules.md` (incl. PBT-01)
- [x] Generate `aidlc-docs/construction/unit-5-requests/functional-design/domain-entities.md`
- [x] Generate `aidlc-docs/construction/unit-5-requests/functional-design/frontend-components.md`

## Questions

## Question 1: Waitlist Dedup
Can a buyer join the same shop's waitlist more than once?

A) No — joining again when already on the waitlist is a no-op (idempotent), not an error and not a duplicate row

B) Yes — each join creates a new entry (e.g., to track repeated interest); duplicates are fine

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 2: Active-Request Definition for Queue-Limit Counting
`ShopCommissionSettings.maxQueue` (Unit 2) caps how many requests count against a seller's queue. Since Order/fulfillment tracking (Unit 6) doesn't exist yet, which `CommissionRequest` statuses count as "active" for this cap, for now?

A) Only `'Requested'` (pending decision) — once a seller accepts, it graduates to being Unit 6's concern and stops counting against Unit 5's own queue check (Unit 6 will need its own capacity logic once Orders exist)

B) `'Requested'` and `'Accepted'` both count — an accepted-but-not-yet-fulfilled request still occupies a seller's queue capacity, which matters even before Unit 6 exists

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 3: StatusBadge Granularity
How granular should the unread indicator be?

A) Simple boolean per request/order: "has this thread changed since I last viewed it" — no per-message counts

B) Per-message unread count (requires tracking exactly which messages a user has seen, not just a last-viewed timestamp)

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 4: Decline Reason
When a seller declines a request (S-17), is a reason required?

A) Required — a non-empty reason must be provided (buyers are told why, which the proposal's UX intent seems to want)

B) Optional — a seller can decline with no reason given

X) Other (please describe after [Answer]: tag below)

[Answer]: a

# Unit of Work Story Map — Inkwell (Phase 1)

All 40 stories from [stories.md](../user-stories/stories.md) assigned to one of the 6 units in [unit-of-work.md](unit-of-work.md).

| Unit | Stories | Count |
|---|---|---|
| 1. Auth & Accounts | S-1 | 1 |
| 2. Shops & Commission Rules | S-2, S-3, S-4, S-5, S-6, S-7, S-8, S-9, S-10, S-11, S-12 | 11 |
| 3. Listings | S-13, S-14 | 2 |
| 4. Browse & Discovery | S-25, S-26, S-27, S-28, S-29 | 5 |
| 5. Commission Requests & Messaging | S-15, S-16, S-17, S-18, S-30, S-31, S-32, S-33, S-34 | 9 |
| 6. Orders & Payments | S-19, S-20, S-21, S-22, S-23, S-24, S-35, S-36, S-37, S-38, S-39, S-40 | 12 |

**Total mapped**: 40 / 40 ✓

## Notes on Boundary-Spanning Stories

- **S-34** (buyer views current request status): Primarily Unit 5 (pre-acceptance Requested/Accepted/Declined status lives on CommissionRequest), but once a request is accepted, the visible status transitions to Order's fulfillment states (owned by Unit 6). Unit 5's implementation of this story will read through to Unit 6 data for accepted requests — this is expected, not a boundary error, since Unit 6 depends on Unit 5 already.
- **S-36** (buyer requests a revision): Listed in `components.md` under CommissionRequest's served stories as a rough grouping, but the actual method (`Order.requestRevision`, per `component-methods.md`) belongs to the Order component — this story is assigned to **Unit 6** here, which is the accurate ownership. (Noted rather than re-opening the approved Application Design artifacts for a one-line grouping label.)
- **S-28, S-29** (buyer views shop page / commission rules): Assigned to Unit 4 (Discovery) as the buyer-facing read path, consistent with `components.md`. The underlying data is written by Unit 2 (ShopProfile/CommissionRuleSet) — Unit 4 cannot be fully built/tested until Unit 2 exists, which matches the approved build sequence.

## Validation

- Every story (S-1..S-40) has exactly one primary owning unit.
- No unit is empty; no unit's story count is disproportionate to its component/service count (Unit 6 has the most stories, consistent with it having 5 components/services and being the most behaviorally rich unit).
- Cross-unit reads (S-34, S-28/29) are documented above and consistent with the approved dependency order in `unit-of-work-dependency.md`.

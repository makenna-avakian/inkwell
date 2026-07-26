# Business Rules — Unit 4: Browse & Discovery

## BR-1: Read-Only, No Authorization Required
All Discovery reads are public — no session/ownership check anywhere in this unit (shop pages, browse feed, and search are all public marketplace content).

## BR-2: Only `available` Listings Appear in the Feed
`sold` and `removed` listings never appear in `browseFeed` — consistent with Unit 3's business-logic-model.md read-path note.

## BR-3: Commission Availability Filter (Question 4: B)
The "commission availability" filter matches shops with `slotState ∈ {'open', 'waitlist'}`. `'closed'` shops are excluded when this filter is active.

## BR-4: Page Size
Fixed at 24 items per page for both `browseFeed` and `searchShops` (Question 3: A, offset/page-based).

## BR-5: Graceful Handling of Unpublished Rules
`getShopPageData` never errors when a shop has no published commission rules — `publishedRules: null` is a normal, expected state (a shop can exist and show a portfolio before ever publishing rules).

## BR-6: Style Tag Matching Is "Any Overlap"
A listing matches a style-tag filter if it has at least one tag in common with the requested filter set — not "all requested tags must be present."

---

## PBT-01: Testable Properties

| Component/Function | Property Category | Property |
|---|---|---|
| Price range filter | Invariant | For any generated listing and any `[min, max]` range, the filter includes the listing if and only if `min <= priceCents <= max` |
| Style-tag overlap matching | Invariant | For any two generated tag sets, the match function returns true if and only if the sets have a non-empty intersection |
| Commission-availability filter | Invariant | For any generated `slotState`, the filter's inclusion decision matches exactly `slotState === 'open' || slotState === 'waitlist'` |
| Pagination | Invariant | For any generated total-item-count and page size, `page * pageSize < totalCount` implies a non-empty page result, and the union of all pages' items (deduplicated) equals the full result set for a fixed filter |

No components lack identifiable properties — the full-text search ranking itself is delegated to Postgres and isn't property-tested (verified via integration tests instead, since correctness depends on Postgres's own `tsvector`/`ts_rank` behavior, not application logic).

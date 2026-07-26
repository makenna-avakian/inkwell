# Functional Design Plan — Unit 4: Browse & Discovery

Source: [unit-of-work.md](../../inception/application-design/unit-of-work.md) (Unit 4), [components.md](../../inception/application-design/components.md) (Discovery), stories S-25..S-29. Discovery is read-only over Units 2/3's data — no new write-side entities.

## ⚠️ Gap Found: Medium/Style-Tag Filtering Has No Backing Data

requirements.md FR-3 promises the browse feed is "filterable by medium, style tag, price range, and commission availability." But neither Unit 2's `ShopProfile`/`CommissionRuleVersion` nor Unit 3's `Listing` has a `medium` or `styleTags` field — this was missed when those units' domain models were designed. Question 1 below resolves it.

## Execution Checklist

- [x] Resolve Question 1 (medium/style-tag data gap) — A
- [x] Resolve Question 2 (search implementation) — B
- [x] Resolve Question 3 (pagination approach) — A
- [x] Resolve Question 4 ("commission availability" filter definition) — B
- [x] Generate `aidlc-docs/construction/unit-4-discovery/functional-design/business-logic-model.md`
- [x] Generate `aidlc-docs/construction/unit-4-discovery/functional-design/business-rules.md` (incl. PBT-01 if applicable)
- [x] Generate `aidlc-docs/construction/unit-4-discovery/functional-design/domain-entities.md`
- [x] Generate `aidlc-docs/construction/unit-4-discovery/functional-design/frontend-components.md`

## Questions

## Question 1: Medium/Style-Tag Filtering
How should this gap be resolved?

A) Add `medium` (single value, e.g. "Watercolor", "Charcoal", freeform text) and `styleTags` (array of freeform text) to `Listing` now — a small migration to Unit 3's table, populated by the seller when creating/editing a listing (Unit 3's `ListingEditForm` gains two new fields). Discovery filters on these.

B) Scope filtering down for Phase 1 to price range + commission availability only; drop medium/style-tag filtering from Phase 1 scope entirely (defer to Phase 2, along with search/filtering enhancements already listed as out-of-scope in requirements.md)

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 2: Search Implementation
How should artist/shop search (S-27) work?

A) Simple case-insensitive substring match (`ILIKE '%query%'`) against shop bio/display name — no extra infrastructure, adequate for Phase 1's expected catalog size

B) Postgres full-text search (`tsvector`/`tsquery`) — better relevance ranking, more setup

X) Other (please describe after [Answer]: tag below)

[Answer]: b

## Question 3: Pagination
How should the browse feed paginate?

A) Offset/page-based (`?page=2`) — simplest to implement and to link to directly

B) Cursor-based (keyset pagination) — more scalable/stable under concurrent inserts, more implementation work

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 4: "Commission Availability" Filter Definition
When a buyer filters for "commission availability," which shops should match?

A) Only shops with `slotState = 'open'`

B) Shops with `slotState = 'open'` OR `'waitlist'` (waitlist is still "available" in a broader sense — a buyer might want to join it)

X) Other (please describe after [Answer]: tag below)

[Answer]: b

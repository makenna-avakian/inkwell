# Functional Design Plan — Unit 3: Listings

Source: [unit-of-work.md](../../inception/application-design/unit-of-work.md) (Unit 3), [components.md](../../inception/application-design/components.md) (Listing), stories S-13, S-14. This is a simple unit — reuses Unit 2's image-upload pattern (R2 presigned URLs) directly rather than reinventing it.

## Execution Checklist

- [x] Resolve Question 1 (listing removal: hard delete vs. soft status) — A
- [x] Resolve Question 2 (multiple images per listing) — A
- [x] Resolve Question 3 (price validation minimum) — B
- [x] Generate `aidlc-docs/construction/unit-3-listings/functional-design/business-logic-model.md`
- [x] Generate `aidlc-docs/construction/unit-3-listings/functional-design/business-rules.md` (incl. PBT-01)
- [x] Generate `aidlc-docs/construction/unit-3-listings/functional-design/domain-entities.md`
- [x] Generate `aidlc-docs/construction/unit-3-listings/functional-design/frontend-components.md`

## Questions

## Question 1: Listing Removal
When a seller "removes" a finished-work listing (S-14), should that be a hard delete or a status change?

A) Soft status: `status` becomes `'removed'` (alongside `'available'`/`'sold'`) — row stays for historical reference (e.g., a past buyer's order still references the listing they bought), just excluded from public browse

B) Hard delete — the row is actually removed

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 2: Multiple Images Per Listing
Should a listing support multiple images (like a product gallery), or exactly one?

A) Multiple — a `ListingImage` table, same pattern as Unit 2's `PortfolioImage` (ordered, no hard count limit)

B) Exactly one image per listing — simpler, a single `imageUrl` column on the listing itself

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 3: Price Validation
What validation applies to a listing's price?

A) Must be a positive integer (cents) — no free listings, same convention as Unit 2's tier/add-on prices

B) Zero is allowed (e.g., a seller wants to list a piece as "free to a good home") — non-negative rather than strictly positive

X) Other (please describe after [Answer]: tag below)

[Answer]: b

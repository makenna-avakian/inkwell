# Functional Design Plan — Unit 2: Shops & Commission Rules

Source: [unit-of-work.md](../../inception/application-design/unit-of-work.md) (Unit 2), [components.md](../../inception/application-design/components.md) (ShopProfile, CommissionRuleSet), [component-methods.md](../../inception/application-design/component-methods.md), stories S-2..S-12.

**Cross-unit note**: This unit implements `isSeller(userId)`, which Unit 1's `service.ts` left as a forward reference (business-logic-model.md). Implementing it here means modifying `src/server/auth/service.ts` (existing file) once `ShopProfile` exists — expected brownfield cross-unit integration, not scope creep.

## Execution Checklist

- [x] Resolve Question 1 (commission rules content format) — C
- [x] Resolve Question 2 (rule-set versioning storage structure) — A
- [x] Resolve Question 3 (tier/add-on validation minimums) — A
- [x] Resolve Question 4 (portfolio image limit) — A
- [x] Generate `aidlc-docs/construction/unit-2-shops/functional-design/business-logic-model.md`
- [x] Generate `aidlc-docs/construction/unit-2-shops/functional-design/business-rules.md` (incl. PBT-01 Testable Properties)
- [x] Generate `aidlc-docs/construction/unit-2-shops/functional-design/domain-entities.md`
- [x] Generate `aidlc-docs/construction/unit-2-shops/functional-design/frontend-components.md`

## Questions

## Question 1: Commission Rules Content Format
The proposal describes the rules editor as "structured, block-based" but also "reads like a living document." Pricing tiers and add-ons are already separate structured fields (per the data model) — this question is only about the free-text/rich-text portion (the "what I will/won't draw, turnaround time" narrative content).

A) Markdown — stored as a plain string, rendered client-side with a Markdown renderer; simplest to build and to diff between versions

B) Sanitized HTML from a rich-text editor (e.g., Tiptap/Lexical) — nicer editing UX, more implementation surface (sanitization is a SECURITY-05 concern — must strip scripts/unsafe tags)

C) Structured JSON blocks (headings/lists/tables as discrete block objects, matching the proposal's literal "block-based editor" description) — most future-flexible, most implementation work for Phase 1

X) Other (please describe after [Answer]: tag below)

[Answer]: c

## Question 2: Rule-Set Versioning Storage
How should versioned commission rule sets actually be stored, given past buyers must see the exact version that applied to their request?

A) Append-only: each publish creates a new `CommissionRuleSet` row (`shopId`, `version` integer, `publishedAt`); "current" is just the row with the highest version for that shop. Old rows are never mutated or deleted.

B) A single mutable "current rules" row plus a separate history/snapshot table that stores a copy on every publish

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 3: Tier/Add-On Validation Minimums
What validation should apply when publishing a rule set?

A) At least one pricing tier required; all tier/add-on prices must be positive; `maxQueue` must be a positive integer

B) No hard minimums for Phase 1 — allow publishing with zero tiers (e.g., a shop that's buy-now-listings-only, no commissions) as long as prices that do exist are non-negative

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 4: Portfolio Image Limit
Should there be a maximum number of portfolio images per shop for Phase 1?

A) No hard limit — rely on per-image size limits (SECURITY-05) and reasonable UX pagination, not a count cap

B) Cap at a specific number — describe under Other

X) Other (please describe after [Answer]: tag below)

[Answer]: a

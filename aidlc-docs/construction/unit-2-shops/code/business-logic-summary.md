# Business Logic Summary — Unit 2: Shops & Commission Rules

## Files
- `src/server/shops/blocks.ts` — Zod schema for content blocks + JSON round-trip helpers (PBT-01/PBT-02).
- `src/server/shops/versioning.ts` — pure `computeNextVersion` (BR-4, PBT-01/PBT-03).
- `src/server/shops/storage.ts` — R2 presigned-upload generation, image validation (BR-7), 5s timeout/one-retry (nfr-design-patterns.md).
- `src/server/shops/repository.ts` — Drizzle queries for all four Unit 2 tables.
- `src/server/shops/service.ts` — `isSeller`, createShop, updateShop, portfolio upload flow, publishRuleSet, setSlotState, getPublishedRuleSet, object-level authorization (`assertOwner`, BR-2).

## Tests
- `blocks.test.ts` — example tests + JSON round-trip property (PBT-01/PBT-02).
- `versioning.test.ts` — example tests + invariant properties (PBT-01/PBT-03).
- `service.test.ts` — example-based: isSeller, shop creation/duplicate rejection, ownership checks on every mutation, publish validation, slot-state transitions, published-rules read path (including the "never published" null case).

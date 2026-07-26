# Business Rules — Unit 2: Shops & Commission Rules

## BR-1: One Shop Per User (Phase 1)
Creating a shop is rejected if the calling user already owns one. No multi-shop-per-seller support in Phase 1.

## BR-2: Object-Level Authorization
Every mutation (edit profile, add portfolio image, publish rules, change slot state) requires `session.userId == ShopProfile.userId` for the target shop (SECURITY-08). Reads (`getShop`, `getPublishedRuleSet`) are public — no auth required, since shop pages are public marketplace pages.

## BR-3: Publish Validation (Question 3: A)
A rule-set publish is rejected unless:
- At least one tier is present
- Every tier's `priceCents` and every add-on's `priceDeltaCents` is a positive integer
- `maxQueue`, if provided, is a positive integer

## BR-4: Append-Only Versioning (Question 2: A)
Publishing always inserts a new `CommissionRuleVersion` row with `version = currentMaxVersion + 1`. No update or delete ever targets an existing version row. `ShopCommissionSettings.currentVersionId` is the only thing that changes to point at the new "current" row.

## BR-5: New Shop Starts Closed
A freshly created `ShopCommissionSettings` row defaults to `slotState = 'closed'` — a seller must explicitly open slots (and will typically publish rules first, though the two actions are independent per BR-6).

## BR-6: Slot State Is Independent of Publishing
Changing `slotState` does not require (or trigger) a rules publish, and publishing rules does not change `slotState`. These are deliberately decoupled — a seller can update their rules text without accidentally reopening a queue they'd closed, and vice versa.

## BR-7: Image Upload Validation (SECURITY-05)
Banner, avatar, and portfolio images must be validated before upload: content-type restricted to `image/jpeg`, `image/png`, `image/webp`; max file size 5MB. Rejected uploads return a field-level error, never a raw storage-provider error (SECURITY-09).

## BR-8: isSeller Is the Single Source of Truth
`isSeller(userId)` (implemented here, re-exported through Unit 1's `service.ts`) is the only sanctioned way to check seller capability anywhere in the codebase — no other unit stores or re-derives this independently (carried over from Unit 1's BR-8).

---

## PBT-01: Testable Properties (Property-Based Testing extension — enforced)

| Component/Function | Property Category | Property |
|---|---|---|
| `computeNextVersion` | Invariant | For any existing version list, the computed next version is always exactly `max(existingVersions) + 1` (or `1` if empty), and is always greater than every existing version |
| Publish validation (BR-3) | Invariant | Validation never accepts a tier/add-on with a non-positive price, for any generated tier/add-on list |
| `rulesContent` block array | Round-trip | `parseBlocks(serializeBlocks(blocks)) == blocks` for any generated valid block array (JSON round-trip through storage) |
| Portfolio image `position` assignment | Invariant | Appending an image always assigns a `position` strictly greater than every existing image's position for that shop, for any existing image count |
| `slotState` transition | Invariant | Every one of the 3×3 possible `(fromState, toState)` pairs is accepted (no illegal-transition rejection exists, per BR-6) — verified exhaustively, not just via property generation |

No components lack identifiable properties — CRUD-shaped operations (createShop, updateShop, addPortfolioImage's happy path) are covered by example-based tests only (PBT-10).

# Frontend Components Summary — Unit 2: Shops & Commission Rules

## Created
- `src/app/components/shops/ShopProfileForm.tsx`, `PortfolioManager.tsx`, `TierListEditor.tsx`, `AddOnListEditor.tsx`, `BlockEditor.tsx`, `CommissionRulesEditor.tsx`, `SlotStateSelector.tsx`
- `src/app/(seller)/shop/new/page.tsx`, `src/app/(seller)/shop/page.tsx`, `src/app/(seller)/shop/rules/page.tsx` — each redirects appropriately based on whether the signed-in user already has a shop (`/shop/new` ↔ `/shop`)
- `src/app/(seller)/shop/actions.ts`, `src/app/(seller)/shop/rules/actions.ts`

## Scope Confirmation
As scoped in functional-design/frontend-components.md, this unit's UI is seller-facing management only. No public shop page was built here — that's Unit 4's responsibility.

## Automation-Friendly Attributes
`data-testid`s follow the established `{component}-{element-role}` convention throughout (e.g., `tier-list-editor-add-button`, `slot-state-selector-open-option`, `commission-rules-editor-publish-button`).

## Tests
- `TierListEditor.test.tsx`, `BlockEditor.test.tsx`, `SlotStateSelector.test.tsx` (including optimistic-update revert on failure), `CommissionRulesEditor.test.tsx` (publish success + validation error surfacing).

# Frontend Components — Unit 2: Shops & Commission Rules

**Scope note**: This unit owns the **seller-facing management UI** only (create/edit shop, manage portfolio, edit and publish commission rules, toggle slot state). The **public-facing** shop page (what a buyer sees) is Unit 4's responsibility (Discovery, per `components.md`'s story assignment of S-28/S-29) — Unit 4 reads this unit's data but this unit does not render the public view.

## Routes
```
src/app/(seller)/shop/new/page.tsx     -> <ShopProfileForm mode="create" />
src/app/(seller)/shop/page.tsx          -> <ShopProfileForm mode="edit" /> + <PortfolioManager />
src/app/(seller)/shop/rules/page.tsx    -> <CommissionRulesEditor /> + <SlotStateSelector />
```

## ShopProfileForm
- **Props**: `mode: "create" | "edit"`.
- **State**: `bio`, `socialLinks` (array), `bannerFile`/`avatarFile` (pending uploads), `submitting`, `fieldErrors`.
- **Interactions**: submit → `createShop` or `updateShop` Server Action.
- **Redirect**: on successful create, redirect to `/shop/rules` (natural next step for a new seller).

## PortfolioManager
- **Props**: `shopId: string`.
- **State**: `images` (current list), `uploading`.
- **Interactions**: upload → validates client-side (type/size, mirroring BR-7) → `addPortfolioImage` Server Action; remove → confirm, then a delete action.

## CommissionRulesEditor
- **Props**: `shopId: string`, `currentVersion?: CommissionRuleVersion`.
- **State**: `tiers[]`, `addOns[]`, `blocks[]` (heading/paragraph/bulletList/image — domain-entities.md's Block Schema), `maxQueue`, `fieldErrors`.
- **Sub-components**: `TierListEditor` (add/edit/remove tiers), `AddOnListEditor`, `BlockEditor` (add/reorder/remove content blocks by type).
- **Interactions**: "Publish" → validates client-side (BR-3 mirrored) → `publishRuleSet` Server Action → creates a new version (BR-4); shows the current published version's content pre-filled as the starting point for edits (editing always starts from the latest published version, never mutates it directly).

## SlotStateSelector
- **Props**: `shopId: string`, `currentState: "open" | "closed" | "waitlist"`.
- **Interactions**: select → `setSlotState` Server Action; no confirmation dialog needed (BR-6: reversible, no destructive consequence).

## Automation-Friendly Attributes
`data-testid`s follow `{component}-{element-role}` (e.g., `shop-profile-form-bio-input`, `commission-rules-editor-publish-button`, `slot-state-selector-open-option`), per core-workflow.md's Automation Friendly Code Rules.

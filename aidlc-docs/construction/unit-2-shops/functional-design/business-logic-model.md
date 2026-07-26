# Business Logic Model — Unit 2: Shops & Commission Rules

## Core Workflows

### isSeller(userId) — resolves Unit 1's forward reference
1. Check whether a `ShopProfile` row exists with `userId = userId`.
2. Return boolean. No other unit should re-derive this independently (BR-8 from Unit 1's business-rules.md).
3. Implemented in `src/server/shops/repository.ts`, re-exported through `src/server/auth/service.ts` (existing file, modified) so callers keep using `isSeller` from the Auth module as originally specified — Unit 2 supplies the implementation, Unit 1's module keeps the public interface.

### Create Shop (first-time seller onboarding)
1. Caller must be signed in (`getSession()`).
2. Reject if a `ShopProfile` already exists for this user (one shop per user, Phase 1).
3. Create `ShopProfile` row.
4. Create a matching `ShopCommissionSettings` row with `slotState = 'closed'`, `currentVersionId = null` (BR: new shop starts closed until rules are published and the seller opens it).

### Edit Shop Profile
1. Caller must be the shop's owner (`ShopProfile.userId == session.userId`) — object-level authorization, SECURITY-08.
2. Update banner/avatar/bio/socialLinks in place (not versioned — only rule *content* is versioned, per Question 2).

### Add Portfolio Image
1. Owner-only.
2. Validate uploaded file (type/size — BR, see business-rules.md).
3. Upload to object storage (provider decided at Infrastructure Design), store the resulting URL + append `PortfolioImage` row with the next `position`.

### Publish Commission Rules
1. Owner-only.
2. Validate tiers/add-ons/maxQueue (BR-3, Question 3: A).
3. Compute `nextVersion = (max existing version for this shop) + 1` (starting at 1).
4. Insert a new `CommissionRuleVersion` row — never update an existing one.
5. Update `ShopCommissionSettings.currentVersionId` to point at the new row.
6. `maxQueue` is stored on `ShopCommissionSettings`, not the version row (it's operational state, not published-content history — see domain-entities.md's refinement rationale).

### Change Slot State
1. Owner-only.
2. Update `ShopCommissionSettings.slotState` directly — no version created, no restriction on which state transitions are allowed (any state can go to any other state; Unit 5's SlotManagementService is what enforces the *automatic* close-on-full-queue behavior, layered on top of this manual control).

### Get Published Rules (read path, used by Unit 3/4/5)
1. Join `ShopCommissionSettings.currentVersionId` → `CommissionRuleVersion` to get current tiers/add-ons/rulesContent, plus `slotState`/`maxQueue` from the settings row.
2. If `currentVersionId` is null (never published), return "no rules published yet" rather than an error — Discovery (Unit 4) and Commission Requests (Unit 5) both need to handle this state gracefully (a shop can exist with a profile but no published rules yet).

### Get Specific Historical Version (used by Unit 5, for requests referencing an old version)
1. Look up `CommissionRuleVersion` by `(shopId, version)` directly — immutable, always available regardless of what's currently published.

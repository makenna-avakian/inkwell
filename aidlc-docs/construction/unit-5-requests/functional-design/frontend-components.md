# Frontend Components — Unit 5: Commission Requests & Messaging

**Scope note**: unlike Units 2/3 (seller-only) or Unit 4 (buyer-only), this unit has UI for **both** personas plus a shared component, since a commission request is inherently a two-party interaction.

## Routes
```
src/app/(seller)/shop/requests/page.tsx        -> <RequestInbox />
src/app/(seller)/shop/requests/[id]/page.tsx   -> <RequestDetail /> (seller view)
src/app/requests/page.tsx                       -> <MyRequests />  (buyer's own requests, any signed-in user)
src/app/requests/[id]/page.tsx                  -> <RequestDetail /> (buyer view — same component, view varies by caller's role)
```

Embedded in `PublicShopPage` (Unit 4, modified here):
```
<CommissionRequestForm shopId /> — shown when slotState === 'open'
<WaitlistJoinButton shopId />    — shown when slotState === 'waitlist'
```

## CommissionRequestForm
- **Props**: `shopId`, the shop's current published tiers/add-ons (passed from `PublicShopPage`'s already-fetched `publishedRules`).
- **State**: selected `tierId`, selected `addOnIds`, `description`, `budgetCents`, `deadlinePreference`, uploaded reference images (reuses the same presigned-upload pattern as Unit 2's `PortfolioManager`/Unit 3's listing images — a third call site for the same underlying flow).
- **Interactions**: submit → `submitRequestAction`.

## WaitlistJoinButton
- **Props**: `shopId`.
- **Interactions**: click → `joinWaitlistAction`; becomes disabled/"Joined" after success (idempotent per BR-3, so a duplicate click is harmless either way).

## RequestInbox (seller)
- **Props**: `shopId`.
- Lists incoming requests with status and an unread indicator (`StatusBadgeIndicator`), linking to `RequestDetail`.

## MyRequests (buyer)
- Lists the signed-in user's own requests across all shops, same list shape as `RequestInbox`.

## RequestDetail (shared, role-aware)
- **Props**: `requestId`.
- Renders request details (tier/add-ons/description/budget/reference images), current status, and `MessageThread`.
- **Seller-only controls**: Accept / Decline (with a required reason field) — only rendered when the viewer is the shop owner and `status === 'requested'`.
- Calls `markRequestSeen` on mount (clears the unread indicator for the viewer).

## MessageThread
- **Props**: `requestId`, `messages`.
- Renders messages oldest-first, a compose box, and posts via `postMessageAction`.

## StatusBadgeIndicator
- **Props**: `unread: boolean`.
- Small dot/badge, reused in `RequestInbox`/`MyRequests` list rows and (future) the Navbar.

## Automation-Friendly Attributes
`data-testid`s follow the established convention (e.g., `commission-request-form-submit-button`, `request-detail-accept-button`, `message-thread-compose-input`).

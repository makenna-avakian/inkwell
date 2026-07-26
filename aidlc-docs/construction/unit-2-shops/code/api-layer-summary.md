# API Layer Summary — Unit 2: Shops & Commission Rules

## Server Actions
- `src/app/(seller)/shop/actions.ts` — `createShopAction`, `updateShopAction`, `requestPortfolioUploadUrlAction` (presigned URL request), `confirmPortfolioImageAction` (records the row after a successful client-side upload).
- `src/app/(seller)/shop/rules/actions.ts` — `publishRuleSetAction`, `setSlotStateAction`.

All actions resolve the caller via `auth()` (Unit 1) and never trust a client-supplied user ID — ownership is always re-checked server-side in `service.ts` (SECURITY-08).

## Tests
- `actions.test.ts` (shop) — shop creation, duplicate-shop error surfacing, upload-URL request success/non-owner-rejection, image confirmation.
- `actions.test.ts` (rules) — publish success, validation-error surfacing, non-owner rejection on slot-state change.

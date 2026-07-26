# API Layer Summary — Unit 3: Listings

## Server Actions
`src/app/(seller)/shop/listings/actions.ts` — `createListingAction`, `updateListingAction`, `setListingStatusAction`, `requestListingUploadUrlAction`, `confirmListingImageAction`. All resolve the caller via `auth()` and never trust a client-supplied user ID (SECURITY-08).

## Tests
`actions.test.ts` — dollar-to-cents conversion, status-change delegation with the correct caller ID.

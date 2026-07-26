# API Layer Summary — Unit 5: Commission Requests & Messaging

## Server Actions
`src/app/requests/actions.ts` — `submitRequestAction`, `joinWaitlistAction`, `acceptRequestAction`, `declineRequestAction`, `postMessageAction`, `markRequestSeenAction`, `requestReferenceUploadAction`. All resolve the caller via `auth()`.

## Tests
`actions.test.ts` — dollar-to-cents conversion, error-message surfacing, correct caller-id delegation.

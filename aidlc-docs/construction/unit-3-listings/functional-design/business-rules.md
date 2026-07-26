# Business Rules — Unit 3: Listings

## BR-1: Price Validation (Question 3: B)
`priceCents` must be a non-negative integer (zero allowed; negative rejected).

## BR-2: Object-Level Authorization
Every mutation (create, edit, add image, mark sold, remove) requires `session.userId == ShopProfile.userId` for the listing's shop — reuses Unit 2's `assertOwner` helper.

## BR-3: Soft Removal (Question 1: A)
Removing a listing sets `status = 'removed'`; the row is never deleted, since completed orders (Unit 6) may reference it.

## BR-4: Status Is Not a Rigid State Machine
Like Unit 2's slot state (BR-6), `status` transitions are not restricted to a one-way pipeline — an owner can correct a mistaken `sold`/`removed` back to `available`. Only Unit 4 (Discovery) and Unit 6 (Orders) treat `available` as meaningful for their own read paths.

## BR-5: Image Upload Reuses Unit 2's Validation
Listing images go through the same `validateImageUpload` (content-type/size) and `createPresignedUpload` functions as shop portfolio images — no separate validation logic to keep in sync.

---

## PBT-01: Testable Properties

| Component/Function | Property Category | Property |
|---|---|---|
| Price validation (BR-1) | Invariant | Validation never accepts a negative `priceCents`, and always accepts `0` and any positive integer, for any generated input |
| `ListingImage` position assignment | Invariant | Appending an image always assigns a `position` strictly greater than every existing image's position for that listing (same property as Unit 2's PortfolioImage, verified independently since it's a separate table/function) |
| `status` transitions | Invariant | Every transition among `{available, sold, removed}` is accepted in either direction (no illegal-transition rejection), verified exhaustively — mirrors Unit 2's slot-state property |

No components lack identifiable properties — CRUD happy paths (createListing, updateListing) are covered by example-based tests only (PBT-10).

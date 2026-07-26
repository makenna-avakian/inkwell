# Component Methods — Inkwell (Phase 1)

High-level method signatures per component. Business rules (validation logic, exact status-transition guards, fee formulas) are deferred to Functional Design (per-unit, Construction phase) per application-design.md rule 12/Note in application-design.md rule file.

## Auth
| Method | Input | Output | Purpose |
|---|---|---|---|
| `signUp` | `{ email, password? , oauthProvider? }` | `User` | Create a new account. |
| `signIn` | `{ email, password? , oauthProvider? }` | `Session` | Authenticate and issue a session. |
| `signOut` | `{ sessionId }` | `void` | Invalidate the current session. |
| `getSession` | `{ requestContext }` | `Session \| null` | Resolve the current caller's session (server-side, every request). |

## ShopProfile
| Method | Input | Output | Purpose |
|---|---|---|---|
| `createShop` | `{ ownerId, banner, avatar, bio, socialLinks }` | `ShopProfile` | Create a new shop for a seller. |
| `updateShop` | `{ shopId, callerId, patch }` | `ShopProfile` | Edit an existing shop (owner-only). |
| `getShop` | `{ shopId }` | `ShopProfile` | Fetch a shop for display. |
| `addPortfolioImage` | `{ shopId, callerId, image }` | `PortfolioImage` | Add an image to the portfolio gallery. |

## CommissionRuleSet
| Method | Input | Output | Purpose |
|---|---|---|---|
| `createRuleSet` | `{ shopId, callerId, tiers, addOns, rulesContent, maxQueue }` | `CommissionRuleSet` | Create a shop's first rule set. |
| `publishNewVersion` | `{ shopId, callerId, tiers, addOns, rulesContent, maxQueue }` | `CommissionRuleSet` | Publish a new version; prior versions remain referenced by existing requests. |
| `setSlotState` | `{ shopId, callerId, state }` | `CommissionRuleSet` | Set slot state to `open`/`closed`/`waitlist`. |
| `getPublishedRuleSet` | `{ shopId }` | `CommissionRuleSet` | Fetch the currently active version for display/request generation. |
| `getRuleSetVersion` | `{ shopId, version }` | `CommissionRuleSet` | Fetch a specific historical version (used by existing requests). |

## Listing
| Method | Input | Output | Purpose |
|---|---|---|---|
| `createListing` | `{ shopId, callerId, title, price, images }` | `Listing` | Create a "buy now" listing. |
| `updateListing` | `{ listingId, callerId, patch }` | `Listing` | Edit an existing listing. |
| `markSold` | `{ listingId, callerId }` | `Listing` | Mark a listing sold/unavailable. |

## Discovery
| Method | Input | Output | Purpose |
|---|---|---|---|
| `browseFeed` | `{ filters?: { medium?, styleTags?, priceRange?, commissionAvailable? }, page }` | `Page<FeedItem>` | Public gallery feed. |
| `searchShops` | `{ query }` | `ShopProfile[]` | Search artists/shops by name. |

## CommissionRequest
| Method | Input | Output | Purpose |
|---|---|---|---|
| `submitRequest` | `{ buyerId, shopId, tierId, addOnIds, description, references, budget, deadlinePreference }` | `CommissionRequest` | Create a request against the shop's currently published rule version. |
| `joinWaitlist` | `{ buyerId, shopId }` | `WaitlistEntry` | Join a shop's waitlist when slot state is `waitlist`. |
| `acceptRequest` | `{ requestId, callerId }` | `CommissionRequest` + triggers `Order.createFromRequest` | Seller accepts; transitions to `Accepted` and hands off to Order/Payment for escrow authorization. |
| `declineRequest` | `{ requestId, callerId, reason }` | `CommissionRequest` | Seller declines with a reason; transitions to `Declined`. |
| `postMessage` | `{ threadOwnerId (requestId or orderId), senderId, body, attachments? }` | `Message` | Post a message to the embedded thread (used both pre- and post-acceptance). |
| `getRequest` | `{ requestId, callerId }` | `CommissionRequest` | Fetch a request (object-level authorization: only buyer/seller party). |

## Order
| Method | Input | Output | Purpose |
|---|---|---|---|
| `createFromRequest` | `{ requestId }` | `Order` | Create an order when a commission request is accepted (internal, invoked by `CommissionRequest.acceptRequest`). |
| `createFromListing` | `{ listingId, buyerId }` | `Order` | Create an order for a direct "buy now" purchase. |
| `markInProgress` | `{ orderId, callerId }` | `Order` | Seller marks work started. |
| `submitForReview` | `{ orderId, callerId, deliverables }` | `Order` | Seller submits work; transitions to `Delivered`. |
| `requestRevision` | `{ orderId, callerId, feedback }` | `Order` | Buyer requests a revision on delivered work. |
| `approveDelivery` | `{ orderId, callerId }` | `Order` + triggers `Payment.captureAndRelease` | Buyer approves; transitions to `Completed`. |
| `getOrder` | `{ orderId, callerId }` | `Order` | Fetch an order (object-level authorization: only buyer/seller party). |
| `getOrderHistory` | `{ userId, role }` | `Order[]` | List a user's past/current orders. |

## Payment
| Method | Input | Output | Purpose |
|---|---|---|---|
| `onboardSeller` | `{ sellerId }` | `StripeConnectAccount` | Start/complete Stripe Connect Express onboarding. |
| `authorizeEscrow` | `{ orderId, amount }` | `PaymentIntent` | Authorize (not capture) funds when a commission is accepted. |
| `captureDirect` | `{ orderId, amount }` | `PaymentIntent` | Immediate capture for a "buy now" purchase (no escrow step). |
| `captureAndRelease` | `{ orderId }` | `Payout` | Capture escrowed funds and initiate seller payout on delivery approval. |
| `refund` | `{ orderId, reason }` | `Refund` | Refund a declined/disputed order. |
| `handleWebhookEvent` | `{ rawPayload, signatureHeader }` | `void` | Verify Stripe webhook signature and apply the resulting state change to the relevant Order — the *only* path by which payment state changes. |
| `computeFees` | `{ subtotal, commissionRatePercent }` | `{ platformFee, sellerNet }` | Pure fee calculation (isolated for Property-Based Testing per requirements.md NFR-3). |

## StatusBadge
| Method | Input | Output | Purpose |
|---|---|---|---|
| `getUnreadSummary` | `{ userId }` | `{ requestId/orderId, unreadCount }[]` | Fetch current unread/status-change indicators for a user. |
| `markSeen` | `{ userId, requestId or orderId }` | `void` | Clear the indicator once the user views the thread/status. |

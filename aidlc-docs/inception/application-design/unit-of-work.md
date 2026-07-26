# Unit of Work — Inkwell (Phase 1)

Monolith (single Next.js codebase in `shareart-frontend`); units are logical module groupings for Construction sequencing, not separate deployables. Approved via [unit-of-work-plan.md](../plans/unit-of-work-plan.md).

## Code Organization Convention (Question 3: A)

Feature-folder by unit under `src/server/`:
```
src/server/
  auth/
  shops/
  discovery/
  listings/
  commission-requests/
  payments/
src/app/            # routes/UI only — calls into src/server/* modules
```

## Team Alignment (Question 4)

Single implementer/session working sequentially through units in the recommended order below (not parallelized across team members for this AI-DLC pass).

## Units

### Unit 1: Auth & Accounts
- **Components**: Auth
- **Directory**: `src/server/auth/`
- **Responsibility**: Sign-up/sign-in via Auth.js, session issuance/validation, role assignment (buyer/seller).
- **Why first**: Every other unit's authorization checks depend on session/role resolution existing.

### Unit 2: Shops & Commission Rules
- **Components**: ShopProfile, CommissionRuleSet
- **Directory**: `src/server/shops/`
- **Responsibility**: Shop profile CRUD, portfolio gallery, versioned commission rule sets, tiers/add-ons, slot state, max queue limit.
- **Depends on**: Unit 1 (Auth — ownership checks).

### Unit 3: Listings
- **Components**: Listing
- **Directory**: `src/server/listings/`
- **Responsibility**: "Buy now" listing CRUD and sold/available status.
- **Depends on**: Unit 1 (Auth), Unit 2 (ShopProfile — a listing belongs to a shop).

### Unit 4: Browse & Discovery
- **Components**: Discovery
- **Directory**: `src/server/discovery/`
- **Responsibility**: Public gallery feed, filtering, artist/shop search — read-only across Shops/Rules/Listings.
- **Depends on**: Unit 2, Unit 3 (reads their data).

### Unit 5: Commission Requests & Messaging
- **Components**: CommissionRequest, StatusBadge, StatusBadgeSyncService, SlotManagementService
- **Directory**: `src/server/commission-requests/`
- **Responsibility**: Rules-validated request submission, waitlist, embedded messaging, request status (Requested/Accepted/Declined), queue-limit auto-close enforcement, and the in-app status badge (FR-8).
- **Depends on**: Unit 1, Unit 2 (validates against a shop's published rule set).

### Unit 6: Orders & Payments
- **Components**: Order, Payment, CommissionLifecycleService, CheckoutService, WebhookHandlerService
- **Directory**: `src/server/payments/`
- **Responsibility**: Post-acceptance fulfillment lifecycle, Stripe Connect onboarding, escrow authorize/capture, direct-purchase capture, refunds, webhook handling, fee computation, payouts.
- **Depends on**: Unit 3 (Listing — direct purchases), Unit 5 (CommissionRequest — commission-derived orders).
- **Note**: Built last per the approved sequence — highest risk (real money movement), benefits from the rest of the domain model already existing and tested.

## Approved Build Sequence

1. Auth & Accounts
2. Shops & Commission Rules
3. Listings
4. Browse & Discovery
5. Commission Requests & Messaging
6. Orders & Payments

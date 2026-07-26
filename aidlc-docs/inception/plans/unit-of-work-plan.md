# Unit of Work Plan — Inkwell (Phase 1)

**Definition context**: `shareart-frontend` is a monolith (single Next.js codebase, per requirements.md). Each "unit of work" here is a **logical module grouping** for Construction-phase purposes (Functional Design → NFR Requirements → NFR Design → Infrastructure Design → Code Generation, one unit fully completed before the next), not an independently deployable service.

## Execution Checklist

- [ ] Resolve Question 1 (unit grouping)
- [ ] Resolve Question 2 (build sequence)
- [ ] Resolve Question 3 (code organization / directory convention)
- [ ] Resolve Question 4 (team alignment)
- [x] Generate `aidlc-docs/inception/application-design/unit-of-work.md`
- [x] Generate `aidlc-docs/inception/application-design/unit-of-work-dependency.md`
- [x] Generate `aidlc-docs/inception/application-design/unit-of-work-story-map.md`
- [x] Validate unit boundaries and dependencies against components.md/services.md
- [x] Ensure all 40 stories (S-1..S-40) are assigned to a unit

## Proposed Grouping (for Question 1)

Based on `components.md`/`services.md`, the natural grouping is 6 units:

| Unit | Components/Services | Rationale |
|---|---|---|
| 1. Auth & Accounts | Auth | Foundational — every other unit depends on it |
| 2. Shops & Commission Rules | ShopProfile, CommissionRuleSet | A shop and its rules are managed together by the seller |
| 3. Browse & Discovery | Discovery | Pure read-layer over Shops/Rules/Listings; can be built once those exist |
| 4. Listings | Listing | Simple, independent of the commission-request pipeline |
| 5. Commission Requests & Messaging | CommissionRequest, StatusBadge, StatusBadgeSyncService, SlotManagementService | The negotiation pipeline, its embedded messaging, and the queue/slot enforcement that gates it |
| 6. Orders & Payments | Order, Payment, CommissionLifecycleService, CheckoutService, WebhookHandlerService | Highest-risk unit (real money); kept together since Order's fulfillment lifecycle and Payment's escrow logic are tightly orchestrated by the same two services |

## Questions

## Question 1: Unit Grouping
Does the 6-unit grouping above match how you want Construction to proceed?

A) Yes, use the 6-unit grouping as proposed

B) Adjust it — describe the change under Other (e.g., split/merge specific units)

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 2: Build Sequence
Recommended sequence (dependency-driven, highest-risk unit last): **Auth & Accounts → Shops & Commission Rules → Listings → Browse & Discovery → Commission Requests & Messaging → Orders & Payments**. Does this order work, or would you like a different sequence?

A) Use the recommended sequence as-is

B) Different order — describe under Other

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 3: Code Organization / Directory Convention
Within the single `shareart-frontend` codebase, how should the logical units be organized on disk?

A) Feature-folder by unit under `src/server/` (e.g., `src/server/auth/`, `src/server/shops/`, `src/server/commission-requests/`, `src/server/payments/`), with `src/app/` holding only routes/UI that call into these modules

B) Flatter structure — one `src/lib/` per component (not per unit) rather than grouped by unit

C) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 4: Team Alignment
You mentioned a 2-5 person team. AI-DLC's Construction phase completes one unit fully (design + code) before starting the next, sequentially, regardless of team size. Does your actual team want to work on multiple units in parallel outside of how this AI-DLC session sequences them (e.g., splitting up the generated per-unit plans among team members to implement concurrently once generated), or should this session's output assume one person/session working through units in the recommended sequence?

A) Sequential is fine — assume one primary implementer working through units in order, as AI-DLC generates them

B) The team will parallelize — note in the unit docs which units have no interdependency and could be picked up by different people once their prerequisite units are done

X) Other (please describe after [Answer]: tag below)

[Answer]: x one person/session is workign through the units int eh recommended saequence

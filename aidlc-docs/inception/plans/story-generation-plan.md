# Story Generation Plan — Inkwell (Phase 1)

Role: Product Owner. Source: [requirements.md](../requirements/requirements.md).

## Execution Checklist

- [x] Confirm breakdown approach (Question 1 below) — C (Hybrid)
- [x] Confirm acceptance criteria format (Question 2 below) — A (Gherkin)
- [x] Confirm story granularity (Question 3 below) — A (fine-grained, one action per story)
- [x] Confirm admin/platform-operator scope for Phase 1 (Question 4 below) — A (no dedicated Admin stories)
- [x] Generate `aidlc-docs/inception/user-stories/personas.md` (Buyer, Seller — no Admin per Question 4)
- [x] Generate `aidlc-docs/inception/user-stories/stories.md` covering FR-1 through FR-7 from requirements.md, using the approved breakdown approach, granularity, and acceptance-criteria format (40 stories: S-1..S-24 Seller, S-25..S-40 Buyer)
- [x] Map each persona to its relevant stories
- [x] Verify every story is Independent, Negotiable, Valuable, Estimable, Small, Testable (INVEST)

## Breakdown Approach Options

- **User Journey-Based**: Stories follow an end-to-end flow (e.g., "buyer discovers → requests → pays → receives"). Good for validating a single flow works end-to-end, weaker at isolating persona-specific needs.
- **Feature-Based**: Stories organized around system capabilities (shop editor, request pipeline, checkout). Good for mapping directly to FR-1..FR-7, weaker at showing cross-feature user journeys.
- **Persona-Based**: Stories grouped by Buyer / Seller / Admin, each with their own set. Good given this project has three clearly distinct personas with different needs; naturally supports INVEST "Independent."
- **Domain-Based**: Stories organized by business domain (Shops, Commissions, Payments, Discovery). Similar to Feature-Based but grouped at a coarser level.
- **Epic-Based**: Hierarchical epics (e.g., "Epic: Commission Lifecycle") with sub-stories underneath. Good for very large scopes; likely more structure than Phase 1 needs.
- **Hybrid**: Persona-based top-level grouping, with stories within each persona's group organized around the features they touch (effectively Persona + Feature). Recommended default for this project given 3 clear personas and 7 FR groups that map cleanly across them.

## Questions

## Question 1: Breakdown Approach
Which story breakdown approach should be used?

A) Persona-Based (Buyer / Seller / Admin, each with their own story set)

B) Feature-Based (organized around FR-1..FR-7 capabilities directly)

C) Hybrid — persona-based top-level grouping, with stories within each persona organized by the features they touch (recommended default given 3 clear personas)

D) Other (please describe after [Answer]: tag below)

[Answer]: c

## Question 2: Acceptance Criteria Format
What format should acceptance criteria use?

A) Gherkin-style Given/When/Then scenarios (directly maps to Playwright/integration test scenarios per requirements.md NFR-3)

B) Simple checklist bullets ("- [ ] condition that must hold")

C) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 3: Story Granularity
How granular should stories be?

A) One story per distinct user action (e.g., "seller sets slot state to closed" is its own story, separate from "seller edits pricing tiers") — more stories, each very small and independently testable

B) One story per FR sub-bullet in requirements.md (e.g., all of FR-2's shop customization is one story; slot management is a separate story) — moderate granularity, roughly matching the FR groups

C) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 4: Admin/Platform-Operator Scope for Phase 1
requirements.md lists "admin moderation tooling" as explicitly out of scope for Phase 1 (deferred to Phase 2), but the proposal's Target Users §2.3 says the Platform Operator still needs basic transaction/dispute visibility even at MVP. Should Phase 1 include any dedicated Admin persona/stories, or is that fully covered by Stripe's own dashboard for now?

A) No dedicated Admin stories for Phase 1 — rely entirely on the Stripe Dashboard for transaction/payout visibility; no in-app admin UI at all yet

B) Include a minimal Admin persona with 1-2 stories for basic in-app visibility (e.g., a simple internal view of orders/transactions), but no moderation/dispute tooling (that stays Phase 2 per requirements.md)

C) Other (please describe after [Answer]: tag below)

[Answer]: a

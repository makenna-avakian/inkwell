# Requirements Clarification Questions — Follow-Up

I detected one contradiction in your answers that needs resolving before I write the final requirements document.

## Contradiction 1: Full three-phase scope vs. weeks-scale timeline

You chose "All three phases, fully" (Q7: C) — that's the full multi-seller marketplace (Phase 1) *plus* reviews/ratings, search/filtering, notifications, milestone payments, admin moderation, and reporting (Phase 2) *plus* reactions, WIP progress reveals, badges/achievements, curated discovery, and a seller analytics dashboard (Phase 3) — built with Stripe Connect escrow payments, RBAC, and all three rule extensions (Security, Resiliency, Property-Based Testing) enforced as blocking constraints, targeting 80%+ test coverage.

You also chose "Weeks-scale target with a small team (2-5 people)" (Q8: B).

Realistically, the full three-phase scope above is a multi-month build for a 2-5 person team, not a weeks-scale one — even a disciplined Phase 1 MVP (auth, shop creation, commission rules, browse/gallery, commission requests, Stripe Connect + escrow, order status, messaging) is normally a multi-week effort on its own for a small team.

### Clarification Question 1
How should this be resolved?

A) Keep the weeks-scale timeline — scope this workflow down to Phase 1 (MVP) only for now; Workflow Planning will sequence Phase 2/3 as a later, separate pass once Phase 1 ships

B) Keep the full three-phase scope — extend the timeline expectation to a months-scale effort instead

C) Keep both roughly as stated — plan and generate units for all three phases now, but sequence them so Phase 1 alone is realistically achievable within the weeks-scale window, with Phase 2/3 units clearly marked as "next" rather than "now"

D) Other (please describe after [Answer]: tag below)

[Answer]: A

---

## Judgment calls I'm otherwise proceeding with (flagging, not blocking)

These weren't contradictions — you explicitly deferred to my judgment or gave a qualitative answer instead of a letter. I'm recording the calls I'm making so you can override any of them before I write `requirements.md`. If you're fine with all of these, just answer Clarification Question 1 above and say "proceed."

- **Q3 (repo split)** — you said "whichever is easiest to maintain." I'm going with **Option A: a single Next.js codebase in `shareart-frontend`** (UI + Server Actions/Route Handlers together), and retiring `shareart-backend`. Reasoning: one codebase, one deploy target, one CI pipeline is the lowest-maintenance option for a 2-5 person team, and it matches the proposal's own recommended architecture.
- **Q4 (ORM)** — no preference given, so I'm going with **PostgreSQL + Drizzle** (the proposal's lighter-weight recommendation, consistent with the "easiest to maintain" steer on Q3).
- **Q10 (checkout unification)** — no preference given, so I'm going with **distinct checkout flows**: a simple direct-purchase checkout for finished "buy now" listings, and a separate escrow-based checkout for commissions (since only commissions need the accept → capture-on-delivery flow).

## Question 2 (only if you disagree with any judgment call above)
Do you want to change any of the three judgment calls above?

A) No — proceed with all three as stated

B) Yes — I'll describe the change(s) under Other

X) Other (please describe after [Answer]: tag below)

[Answer]: A

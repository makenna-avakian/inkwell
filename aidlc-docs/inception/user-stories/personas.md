# Personas — Inkwell (Phase 1)

Per the approved story plan, Phase 1 does not include a dedicated Admin persona/stories (Question 4: A) — the platform operator relies on the Stripe Dashboard directly for transaction/payout visibility during Phase 1. Two personas are in scope.

## Persona: Seller ("Riley the Artist")

- **Who they are**: An artist opening a shop on Inkwell — ranges from a hobbyist posting their first piece to an established artist migrating an existing following (requirements.md §Target Users, from the source proposal).
- **Goals**: Get a shop live quickly; publish clear commission rules so buyers self-select correctly; keep a manageable queue; get paid reliably without chasing buyers for money.
- **Frustrations today**: Managing commission rules and queue state via ad-hoc docs/DMs (the "living Google Doc" pattern the proposal explicitly wants to replace); no structured way to stop taking requests once busy; payment collection and follow-through is manual and risky (no escrow).
- **Technical comfort**: Varies widely — the shop/commission-rules editor must not assume technical sophistication.

## Persona: Buyer ("Sam the Collector")

- **Who they are**: Ranges from a casual browser discovering art for the first time to a repeat collector who commissions regularly (requirements.md §Target Users).
- **Goals**: Find art/artists matching their taste and budget quickly; understand a seller's rules *before* committing money or time; know their payment is safe until they receive what they asked for; track where their request/order stands without having to ask.
- **Frustrations today**: Uncertainty about whether a seller is even open for commissions; no standard way to know what's included at a given price tier; no protection if a commission never gets delivered.
- **Technical comfort**: Assume general web-user comfort; no assumption of familiarity with commission-culture conventions (this needs to be self-explanatory in the UI, not just for insiders).

## Persona Notes for Later Phases

If Phase 2/3 work later introduces admin moderation tooling (per requirements.md's Out-of-Scope list), an Admin/Platform-Operator persona should be added at that time.

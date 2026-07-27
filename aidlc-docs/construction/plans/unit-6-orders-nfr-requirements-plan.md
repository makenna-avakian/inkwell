# NFR Requirements Plan — Unit 6: Orders & Payments

Stripe is a genuinely new external dependency (not reused from prior units) — two real questions worth asking. Stripe API version pinning and test/live mode handling are decided directly (the SDK handles live/test transparently based on which secret key is configured; no branching needed).

## Execution Checklist

- [x] Resolve Question 1 (currency scope) — A (USD only)
- [x] Resolve Question 2 (Stripe Connect payout-eligibility handling) — A (check payouts_enabled live)
- [x] Generate `aidlc-docs/construction/unit-6-orders/nfr-requirements/nfr-requirements.md`
- [x] Generate `aidlc-docs/construction/unit-6-orders/nfr-requirements/tech-stack-decisions.md`

## Questions

## Question 1: Currency Scope
requirements.md's launch scope is US + Canada. Should Phase 1 support one currency or two?

A) USD only for Phase 1 — simplest; a Canadian seller/buyer still transacts in USD (Stripe handles the cross-border conversion on its end). Multi-currency is a Phase 2 enhancement if needed.

B) USD and CAD — sellers/buyers can transact in either, based on... (describe the selection rule under Other if you pick this)

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 2: Stripe Connect Payout-Eligibility Handling
A seller can complete Stripe Connect's basic onboarding flow while Stripe is still verifying them (`payouts_enabled` can be false even after onboarding starts). Should the app check this before allowing commission acceptance/buy-now listing?

A) Check `payouts_enabled` explicitly — block accepting requests/listing items until Stripe confirms the account can actually receive payouts, not just that onboarding was started

B) Don't check it separately — just attempt the Connect transfer at payout time and surface any Stripe error then; simpler, but a seller could complete a whole commission before discovering they can't be paid yet

X) Other (please describe after [Answer]: tag below)

[Answer]: a

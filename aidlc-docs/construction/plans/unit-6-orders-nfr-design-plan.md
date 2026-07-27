# NFR Design Plan — Unit 6: Orders & Payments

All prior units use a hand-rolled "5s timeout, one retry at 100ms" wrapper for external calls. This unit's external dependency (Stripe) is different: the `stripe` npm SDK has **built-in** network-retry support designed specifically to work safely with idempotency keys — worth a question rather than silently deviating from or blindly following the established convention.

## Execution Checklist

- [x] Resolve Question 1 (Stripe call retry mechanism: SDK-native vs. the established custom wrapper) — A
- [x] Generate `aidlc-docs/construction/unit-6-orders/nfr-design/nfr-design-patterns.md`
- [x] Generate `aidlc-docs/construction/unit-6-orders/nfr-design/logical-components.md`

## Questions

## Question 1: Stripe Call Retry Mechanism
Prior units wrap external calls in a hand-rolled "5s timeout, one retry" helper. Stripe's own SDK has a `maxNetworkRetries` option built specifically to safely retry idempotency-keyed requests (it won't retry non-idempotent operations, and handles Stripe-specific transient-error classification better than a generic wrapper would). Which should this unit use?

A) Stripe SDK's native `maxNetworkRetries` (e.g., set to 1) instead of the hand-rolled wrapper — more correct for this specific dependency, a deliberate deviation from the pattern used elsewhere, since Stripe's own retry logic understands its own error types better than a generic wrapper can

B) Keep the same hand-rolled wrapper for consistency across the codebase, even though Stripe's SDK has a more purpose-built option

X) Other (please describe after [Answer]: tag below)

[Answer]: a

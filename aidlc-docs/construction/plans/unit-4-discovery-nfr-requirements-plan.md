# NFR Requirements Plan — Unit 4: Browse & Discovery

Unlike Units 2/3 (seller-only tooling), this unit is the primary **buyer-facing** surface — the first real performance-sensitive public page. Two new questions worth asking that weren't relevant for the seller-only units.

## Execution Checklist

- [x] Resolve Question 1 (browse feed performance target) — A
- [x] Resolve Question 2 (caching/revalidation strategy) — A
- [x] Generate `aidlc-docs/construction/unit-4-discovery/nfr-requirements/nfr-requirements.md`
- [x] Generate `aidlc-docs/construction/unit-4-discovery/nfr-requirements/tech-stack-decisions.md`

## Questions

## Question 1: Browse Feed Performance Target
Should there be an explicit latency target for the browse feed / shop page, given these are the primary buyer-facing pages?

A) p95 < 500ms server-render time for the browse feed and shop page (same convention as Unit 1's sign-in target)

B) No hard target for Phase 1 — revisit once real traffic/data volume exists

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 2: Caching / Revalidation Strategy
The browse feed and shop pages are public and read-heavy. Should they use Next.js's static/ISR caching, or always render fresh?

A) Always fresh (dynamic rendering, no cache) — simplest, guarantees a buyer never sees stale slot-state/listing data, acceptable at Phase 1 traffic levels

B) ISR with a short revalidation window (e.g., 60s) — reduces DB load under traffic, at the cost of buyers occasionally seeing slightly stale availability

X) Other (please describe after [Answer]: tag below)

[Answer]: a

# Infrastructure Design Plan — Unit 2: Shops & Commission Rules

## Execution Checklist

- [x] Resolve Question 1 (R2 bucket strategy across environments) — B
- [x] Resolve Question 2 (public read access for images) — A
- [x] Generate `aidlc-docs/construction/unit-2-shops/infrastructure-design/infrastructure-design.md`
- [x] Generate `aidlc-docs/construction/unit-2-shops/infrastructure-design/deployment-architecture.md`
- [x] Update `aidlc-docs/construction/shared-infrastructure.md` with the R2 decisions (project-wide, first needed here)

## Questions

## Question 1: R2 Bucket Strategy Across Environments
Following the same environment split as Neon (dev/staging/prod, Question 3 at Unit 1 Infrastructure Design), how should R2 buckets be organized?

A) One R2 bucket per environment (3 buckets: `inkwell-dev`, `inkwell-staging`, `inkwell-prod`) — full isolation, mirrors the Neon-branch-per-environment approach

B) One shared bucket with environment-prefixed object keys (`dev/...`, `staging/...`, `prod/...`) — simpler to manage, less isolation

X) Other (please describe after [Answer]: tag below)

[Answer]: b

## Question 2: Public Read Access for Images
`next/image` needs a stable URL to fetch each image from. Since images are public marketplace content (shop banners, portfolio pieces — not private data), how should reads work?

A) Public bucket read access via R2's public bucket URL (or a custom domain mapped to the bucket) — `next/image`'s `remotePatterns` allowlists that domain; no per-request signing needed for reads (only uploads are presigned/authenticated)

B) Signed GET URLs generated per-request, even though the content is public — more complex, no real security benefit for content that's meant to be public anyway

X) Other (please describe after [Answer]: tag below)

[Answer]: a

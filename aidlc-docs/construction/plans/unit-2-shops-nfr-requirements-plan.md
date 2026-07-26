# NFR Requirements Plan — Unit 2: Shops & Commission Rules

Project-wide decisions already fixed (Neon, Vercel, 3 environments, CI/CD, DR strategy) are not re-asked. This unit is the first to need object storage (banner/avatar/portfolio images) — requirements.md left the provider as "Cloudflare R2 or S3" (either/or), so that's decided here, project-wide, for the first time.

## Execution Checklist

- [x] Resolve Question 1 (object storage provider — project-wide, first needed by Unit 2) — A (R2)
- [x] Resolve Question 2 (image optimization approach) — A (next/image)
- [x] Resolve Question 3 (upload flow: direct-to-storage vs. proxy-through-server) — A (direct-to-storage)
- [x] Generate `aidlc-docs/construction/unit-2-shops/nfr-requirements/nfr-requirements.md`
- [x] Generate `aidlc-docs/construction/unit-2-shops/nfr-requirements/tech-stack-decisions.md`

## Questions

## Question 1: Object Storage Provider
requirements.md left this as "Cloudflare R2 or S3." Which one?

A) Cloudflare R2 — no egress fees (relevant since artwork images are read far more than written), S3-compatible API

B) AWS S3 — largest ecosystem/tooling, egress fees apply

C) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 2: Image Optimization
How should images be resized/optimized for delivery?

A) Rely on Next.js's built-in `next/image` for on-the-fly resizing/optimization/caching at request time — no separate image-processing pipeline needed for Phase 1

B) Add a dedicated resize-on-upload pipeline (e.g., a serverless function that generates multiple sizes at upload time)

C) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 3: Upload Flow
How should image bytes get from the browser to object storage?

A) Direct-to-storage: the server issues a short-lived presigned upload URL; the browser uploads directly to R2/S3, bypassing the Next.js server entirely for the file bytes (better scalability, no serverless function payload-size limit concerns)

B) Proxy-through-server: the browser uploads to a Next.js Route Handler, which validates and forwards the bytes to storage (simpler to reason about, but subject to serverless request body size limits)

C) Other (please describe after [Answer]: tag below)

[Answer]: a

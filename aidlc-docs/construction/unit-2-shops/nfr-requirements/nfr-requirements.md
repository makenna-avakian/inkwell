# NFR Requirements — Unit 2: Shops & Commission Rules

## Scalability
- Presigned-URL direct uploads (Question 3: A) mean image bytes never pass through the Next.js/Vercel compute layer — upload volume scales independently of app server capacity.

## Performance
- No hard latency target set for shop management pages (internal/seller-only tooling, not the buyer-facing critical path).
- Image delivery relies on `next/image`'s on-the-fly optimization + caching (Question 2: A) — no separate CDN warm-up step needed for Phase 1.

## Availability
- Inherits project-wide single-region multi-zone / Backup & Restore DR. No unit-specific override.
- R2 has its own independent availability SLA from Vercel/Neon — a storage outage degrades image display but should not block shop/rules CRUD (text data lives in Neon, independent of R2).

## Security
- Presigned upload URLs are short-lived (5 minutes) and scoped to a single object key — a leaked URL can't be reused to upload elsewhere or after expiry (SECURITY-06 least-privilege, applied to storage access).
- Content-type/size validated server-side *before* issuing the presigned URL (BR-7) — the presigned URL itself is also scoped to the validated content-type, so a client can't swap in a different file type after receiving the URL.
- SECURITY-08 (object-level authorization) enforced on every mutation per business-rules.md BR-2.

## Reliability
- Orphaned uploads (client obtains a presigned URL but never completes the upload, or the follow-up `addPortfolioImage` call fails after upload) are not cleaned up automatically in Phase 1 — flagged as a known gap, acceptable at this scale (a stray unreferenced R2 object costs storage, not correctness).

## Maintainability
- R2's S3-compatible API means the storage client code uses the standard AWS S3 SDK (`@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`), not a Cloudflare-proprietary SDK — lower switching cost if the provider ever changes.

## Usability
- Upload progress/errors surface inline in `PortfolioManager` (functional-design/frontend-components.md) rather than a generic "upload failed" — validation errors (wrong type/too large) are caught client-side before the presigned-URL round-trip where possible.

## Tech Stack Selection
See [tech-stack-decisions.md](tech-stack-decisions.md).

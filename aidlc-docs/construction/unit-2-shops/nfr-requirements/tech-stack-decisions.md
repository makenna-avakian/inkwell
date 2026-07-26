# Tech Stack Decisions — Unit 2: Shops & Commission Rules

| Concern | Choice | Rationale |
|---|---|---|
| Object storage | Cloudflare R2 | Question 1: A — no egress fees, S3-compatible. |
| Storage SDK | `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` | R2's S3-compatible API works with the standard AWS SDK; avoids a Cloudflare-proprietary client. |
| Image optimization/delivery | `next/image` | Question 2: A — no separate resize pipeline for Phase 1. |
| Upload flow | Presigned PUT URLs, issued by a Server Action, uploaded directly from the browser | Question 3: A. |
| Rich content storage | `jsonb` columns (Drizzle) for `tiers`, `addOns`, `rulesContent` | Matches the block-schema/versioning design in functional-design/domain-entities.md; Postgres jsonb avoids a second datastore for structured-but-flexible content. |
| Validation library | Zod | Project-wide convention (requirements.md), reused for tier/add-on/block schema validation. |
| Testing | Vitest + fast-check (unit/PBT), React Testing Library (component) | Project-wide convention (requirements.md NFR-3). |

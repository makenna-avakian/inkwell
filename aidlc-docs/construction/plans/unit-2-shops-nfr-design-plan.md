# NFR Design Plan — Unit 2: Shops & Commission Rules

Project-wide resiliency process decisions (CI/CD, rollback, deployment style, incident response, resiliency testing) were fixed at Unit 1 and apply here unchanged — not re-asked. This unit's only new external dependency is R2 (for presigned-URL generation; the actual file upload happens browser-to-R2 directly, per NFR Requirements, so the app server has no timeout exposure to the upload transfer itself — only to the quick "generate a presigned URL" API call).

## Execution Checklist

- [x] Resolve Question 1 (R2 presigned-URL-generation call timeout/retry) — A
- [x] Generate `aidlc-docs/construction/unit-2-shops/nfr-design/nfr-design-patterns.md`
- [x] Generate `aidlc-docs/construction/unit-2-shops/nfr-design/logical-components.md`

## Questions

## Question 1: R2 Presigned-URL Call Resilience
Should the server-side call to R2 (generating a presigned upload URL) follow the same timeout/retry convention as Unit 1's external calls (5s timeout, one retry at 100ms), or does it need something different?

A) Same convention as Unit 1 (5s timeout, one retry at 100ms then fail) — it's a small, fast API call, no reason to treat it differently

B) Different — describe under Other

X) Other (please describe after [Answer]: tag below)

[Answer]: a

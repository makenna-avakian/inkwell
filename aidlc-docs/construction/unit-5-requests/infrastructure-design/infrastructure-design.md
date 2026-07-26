# Infrastructure Design — Unit 5: Commission Requests & Messaging

No new infrastructure — see [shared-infrastructure.md](../../shared-infrastructure.md).

## Storage
- New tables in the shared Neon database (see nfr-design/logical-components.md).
- Reference images in the existing `inkwell-media` R2 bucket under `{environment}/shops/{shopId}/requests/{requestId}/...`.

## Compute / Networking / Monitoring
Identical to prior units — same app, same Sentry error tracking, no new environment variables.

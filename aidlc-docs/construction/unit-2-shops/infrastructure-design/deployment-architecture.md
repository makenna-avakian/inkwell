# Deployment Architecture — Unit 2: Shops & Commission Rules

```mermaid
flowchart TD
    Browser["Browser"] -->|"1: request presigned URL"| VercelProd["Vercel Production Deployment"]
    VercelProd -->|"2: generate presigned PUT URL"| R2["Cloudflare R2\ninkwell-media bucket"]
    VercelProd -->|"3: return presigned URL"| Browser
    Browser -->|"4: PUT image bytes directly"| R2
    Browser -->|"5: confirm upload complete"| VercelProd
    VercelProd --> Neon["Neon Postgres\n(portfolio_images row)"]

    Reader["Any visitor"] -->|"GET"| CustomDomain["media.inkwell.app"]
    CustomDomain --> R2

    style R2 fill:#FFCDD2,stroke:#C62828,stroke-width:2px,color:#000
```

## Environment Mapping
Extends Unit 1's table (aidlc-docs/construction/unit-1-auth/infrastructure-design/deployment-architecture.md) with:

| Environment | R2 Object Key Prefix |
|---|---|
| Development | `dev/` |
| Staging | `staging/` |
| Production | `prod/` |

## Rollback Path
A code rollback (Vercel instant rollback, per Unit 1's decision) does not affect already-uploaded R2 objects or existing Postgres rows — this unit introduces no destructive migrations, so a code-only rollback remains sufficient, consistent with Unit 1.

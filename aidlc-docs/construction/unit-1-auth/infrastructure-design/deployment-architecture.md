# Deployment Architecture — Unit 1: Auth & Accounts

```mermaid
flowchart TD
    Dev["Developer push / PR"] --> GHA["GitHub Actions\n(lint, typecheck, test, coverage gate)"]
    GHA -->|PR| VercelPreview["Vercel Preview Deployment\n(+ Neon branch DB)"]
    GHA -->|merge to main| VercelProd["Vercel Production Deployment"]

    VercelPreview --> NeonStaging["Neon: staging branch"]
    VercelProd --> NeonProd["Neon: production database"]

    VercelProd --> Cron["Vercel Cron Job\n(daily Session/LoginAttempt cleanup)"]
    Cron --> NeonProd

    VercelProd --> Google["Google OAuth"]
    VercelProd --> Sentry["Sentry\n(error tracking)"]

    style VercelProd fill:#4CAF50,stroke:#1B5E20,stroke-width:2px,color:#fff
    style NeonProd fill:#FFCDD2,stroke:#C62828,stroke-width:2px,color:#000
```

## Environment Mapping (Question 3: B)

| Environment | Vercel | Database |
|---|---|---|
| Development | Local `next dev` | Local Postgres or a personal Neon branch |
| Staging | Vercel preview deployment (persistent staging alias) | Neon staging branch |
| Production | Vercel production deployment | Neon production database |

## Rollback Path
Per the project-wide rollback decision (NFR Design): a bad production deploy is reverted via Vercel's instant rollback to the previous deployment. Since Unit 1 introduces new tables (User/Session/OAuthAccount/LoginAttempt) but no destructive migrations, a code rollback alone is sufficient — no database-aware rollback procedure is needed for this unit's initial release.

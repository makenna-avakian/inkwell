# NFR Design Patterns — Unit 3: Listings

No new resilience or security patterns beyond direct reuse of Unit 2's:
- R2 presigned-URL generation: same 5s timeout / one-retry convention (reused function, not reimplemented).
- Postgres queries: same 5s timeout / one-retry project-wide default.
- Circuit breaking: not implemented, same rationale as Units 1/2 (single external dependency, not worth the complexity at this scale).
- Fail-safe defaults: a listing query for a non-existent/removed listing returns "not found" gracefully to Unit 4's browse feed (excluded, not an error) — mirrors Unit 2's "no rules published yet" pattern.

No project-wide resiliency questions remained to ask — all were resolved at Unit 1 (Requirements Analysis) and Unit 1 NFR Design.

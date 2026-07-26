# Tech Stack Decisions — Unit 4: Browse & Discovery

| Concern | Choice | Rationale |
|---|---|---|
| Search | Postgres native full-text search (`tsvector`/`tsquery`/`ts_rank`) | No new service — reuses the existing Neon Postgres instance; adequate for Phase 1 scale (Functional Design Question 2: B). |
| Filtering | Plain SQL `WHERE` clauses via Drizzle (`eq`, `between`, JSONB containment for style tags) | No new library — consistent with Units 1-3's query style. |
| Rendering | Next.js Server Components, dynamic (no `revalidate`/ISR) | NFR Requirements Question 2: A. |
| Pagination | Offset-based (`LIMIT`/`OFFSET`) | Functional Design Question 3: A. |

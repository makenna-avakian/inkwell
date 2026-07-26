# Tech Stack Decisions — Unit 5: Commission Requests & Messaging

| Concern | Choice | Rationale |
|---|---|---|
| Messaging refresh | Client-side polling (10s interval), plain HTTP re-fetch of the thread | Question 1: B — no new infrastructure needed. |
| Reference image upload | Reuses Unit 2's R2 presigned-upload flow directly | Third call site for the same underlying flow (Units 2, 3, now 5). |
| Validation | Zod | Project-wide convention. |
| Testing | Vitest, fast-check, RTL | Project-wide convention. |

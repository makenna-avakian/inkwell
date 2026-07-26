# Application Design — Clarification

## Scope Mismatch: In-App Push Notifications vs. Approved Requirements

You answered Question 3 with **B** — a lightweight in-app push/badge notification system, built now in Phase 1.

`requirements.md`'s "Explicitly Out of Scope (Phase 1)" section currently lists **"notifications (email + in-app)"** as deferred to Phase 2, based on your earlier answer that this workflow should scope down to Phase 1/MVP only.

A small in-app unread-indicator/badge is a modest addition, not the full notification system (no email, no notification preferences, no digest) — but it's still new scope beyond what's currently written down, so I want to confirm rather than silently expand it.

## Clarification Question
How should this be resolved?

A) Confirm the small addition — amend requirements.md's Phase 1 scope to include a lightweight in-app unread/status-badge notification (no email, no preferences); everything else notification-related stays Phase 2

B) Revert to pull-based only (Question 3: A) — keep Phase 1 exactly as requirements.md currently states; buyers/sellers check status by opening the page, no badge/unread system yet

C) Other (please describe after [Answer]: tag below)

[Answer]: a

# NFR Requirements — Unit 3: Listings

**No unit-specific questions were needed.** Every NFR category for this unit is already fully covered by Unit 2's decisions, since Listings deliberately reuses Unit 2's storage/validation infrastructure rather than introducing anything new:

- **Scalability/Performance**: same as Unit 2 — presigned direct-to-R2 uploads, `next/image` delivery, no new bottleneck introduced.
- **Availability**: inherits project-wide single-region multi-zone / Backup & Restore DR.
- **Security**: same object-level authorization pattern (`assertOwner`, reused from Unit 2), same image validation (`validateImageUpload`, reused directly — not reimplemented).
- **Reliability**: no new external dependency; same R2/timeout/retry posture as Unit 2.
- **Tech Stack**: no new libraries — see [tech-stack-decisions.md](tech-stack-decisions.md) (confirms reuse, adds nothing).

This is a deliberate outcome of the unit's design (functional-design/business-logic-model.md explicitly reuses Unit 2's infrastructure), not an oversight.

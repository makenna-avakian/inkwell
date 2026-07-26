# Resiliency Baseline — Required Questions

You opted into the Resiliency Baseline extension. Its rules require two decisions to come from you directly, not from my judgment, before I can finalize `requirements.md`. This is the last question round — after this I'll write the requirements document.

## Question: RTO/RPO Goals and Disaster Recovery Strategy
What are your Recovery Time Objective (RTO) and Recovery Point Objective (RPO) goals? These determine the appropriate Disaster Recovery strategy and infrastructure redundancy level.

A) RPO/RTO: Hours — Backup & Restore strategy. Lowest cost ($). Data backed up, no services deployed. Redeploy from IaC and restore from backups on failure. Suitable for non-critical workloads.

B) RPO/RTO: 10s of minutes — Pilot Light strategy. Cost: $$. Data live, services idle. Infrastructure deployed but not running, scaled up on failover. Suitable for important workloads.

C) RPO/RTO: Minutes — Warm Standby strategy. Cost: $$$. Data live, services run at reduced capacity. Scaled up during failover. Suitable for business-critical applications.

D) RPO/RTO: Near real-time — Multi-site Active/Active strategy. Highest cost ($$$$). Data live, live services in multiple regions simultaneously. Suitable for mission-critical, zero-downtime requirements.

E) N/A — Single-region deployment is acceptable, no cross-region DR needed. Rely on multi-zone availability within one region.

X) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question: Change Management Process
How should production changes for this workload be governed? AI-DLC will conform the design to your answer rather than inventing a process.

A) Use our existing organizational change management process — provide the name/tool (e.g., ServiceNow, Jira Change, internal CAB). AI-DLC will reference it and ensure deployable artifacts fit that process (change records, approval gates).

B) No formal process exists yet — AI-DLC should propose a lightweight change management process (change record + approval + rollback note) for the team to adopt.

C) N/A — this workload is exempt from formal change management (e.g., internal tooling). Document the exemption rationale.

X) Other (describe after [Answer]: tag below)

[Answer]: C - this is going to be a small startup. we will try different thigns to see how well everything works. 

## Question: Regional Topology
Does this workload require multi-region deployment, or is single-region with multi-zone redundancy sufficient?

A) Single-region, multi-zone — tolerates zone failure, not full-region failure. Lower cost. (Aligns with RTO/RPO options A/B/E above.)

B) Multi-region active-passive — survives region failure with failover. Higher cost. (Aligns with Warm Standby / Pilot Light cross-region.)

C) Multi-region active-active — survives region failure with no downtime. Highest cost. (Aligns with Active/Active.)

X) Other (describe after [Answer]: tag below)

[Answer]: A

---

*(Deferred to later stages per the resiliency rules: CI/CD tooling, rollback mechanism, and deployment style will be asked at NFR Design; incident response process will be asked at Requirements or NFR Design — I'll ask it alongside the NFR Design questions to keep this round focused.)*

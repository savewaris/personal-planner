# Multi-Agent Swarm & Peer Consensus Rules

## 1. Autonomous Multi-Action Delegation Trigger

When a user request or roadmap item contains **more than one action, file, or domain** (e.g., modifying database schema + building UI components + writing documentation):
1. **Immediate Autonomous Decomposition**: Break the request down into discrete domain subtasks and immediately spawn parallel subagents using `invoke_subagent` without waiting for redundant manual confirmation.
2. **Assign Optimal Model Tiers**: Map each subagent to the most efficient model tier (`flash_lite`, `flash`, `pro`, `inherit`) based on task complexity.

---

## 2. Dynamic Model Escalation Protocol
1. **Fast-Path Default**: Leaf UI tasks, documentation, and automated test audits execute on `flash` / `flash_lite`.
2. **Autonomous Escalation Triggers**:
   - **Type / Build Failures**: If a `flash` subagent cannot resolve compiler errors after 2 iterations, escalate directly to `pro`.
   - **Database & Data Loss Risk**: Any structural schema migration affecting existing tables or foreign keys routes to `pro`.
   - **Security / Session Boundaries**: Mutating admin routes or session token validation routes to `pro`.

---

## 3. Real-Time Incremental Step-by-Step Logging

- Record every concrete intermediate action to the live action ledger:
  ```bash
  npm run agent:state -- --step "<Action Description>"
  npm run agent:state -- --step-done "<Action Description>"
  ```
- Record session checkpoints before concluding:
  ```bash
  npm run agent:state -- --checkpoint "<Summary of changes and next actions>"
  ```

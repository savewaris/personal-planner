---
name: doc-architect
description: Authoring Architecture Decision Records (ADRs), API documentation, component guides, and syncing README.md across projects.
recommended_model: flash
---

# Documentation Architect Skill

Use this skill when recording architectural decisions, documenting REST API endpoints, generating usage guides, or synchronizing repository documentation.

---

## Capabilities & Workflows

### 1. Authoring an Architecture Decision Record (ADR)
1. Determine the next sequence number in `docs/adr/` (e.g. `0001-project-scoped-agents.md`, `0002-real-time-step-logging.md`).
2. Follow the standard ADR template:
   - **Title**: `ADR NNNN: [Title]`
   - **Status**: `Accepted` | `Proposed` | `Superseded`
   - **Context**: Problem statement & constraints.
   - **Decision Drivers**: Core requirements, trade-offs, and design goals.
   - **Considered Options**: Alternative approaches evaluated.
   - **Decision Outcome**: The selected architectural approach and why.
   - **Consequences**: Positive effects, trade-offs, maintenance requirements, and migration path.

### 2. Documenting API Endpoints
When adding or altering an API route or endpoint handler:
- Document HTTP method, route path, authentication/authorization requirements.
- Document request parameters, payload schema, response shape, and error status codes.
- Provide practical `curl` or `fetch()` code snippets.

### 3. README & Workflow Synchronization
- Ensure `README.md` reflects current npm/build scripts, environment variables, dependencies, and architecture.
- Keep agent state documentation (`docs/github_issues_roadmap.md`, `.agents/state/SESSION_LOG.md`) updated.
- Maintain clear JSDoc / docstrings on public utility functions and domain models.

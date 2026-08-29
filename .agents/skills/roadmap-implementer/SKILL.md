---
name: roadmap-implementer
description: Autonomous runbook for picking and implementing issues from docs/github_issues_roadmap.md end-to-end across database, backend, frontend, and verification layers.
recommended_model: pro
---

# Roadmap & Issue Implementer Skill

This skill guides an agent to select, implement, verify, and document issues directly from `docs/github_issues_roadmap.md` end-to-end.

---

## Step-by-Step Implementation Protocol

### 1. Read & Select Issue
- Open `docs/github_issues_roadmap.md` and identify the next uncompleted issue in the active milestone.
- Extract:
  - Technical requirements (schema changes, API routes, admin UI, public UI).
  - Acceptance criteria checklists.
- Declare task lock and live step:
  ```bash
  npm run agent:state -- --start ISSUE-N
  npm run agent:state -- --step "Starting implementation of Issue #N"
  ```

### 2. Database Schema (if required)
- Update ORM schema (e.g. `prisma/schema.prisma`) with new fields/models with safe defaults.
- Validate and synchronize:
  ```bash
  npx prisma validate
  npx prisma db push
  npx prisma generate
  ```

### 3. API & Backend Handlers
- Implement or update Route Handlers / API endpoints.
- Ensure proper response status codes, input validation, and typed contracts.

### 4. Admin & Management Interface
- Update management interface components with input fields and validation.
- Ensure responsive controls and error handling.

### 5. Public / User-Facing UI
- Update or create section components adhering to design tokens and CSS Modules / styling rules.
- Ensure micro-interactions utilize physics springs and honor reduced motion preferences.

### 6. Full Verification Gate
```bash
npm run lint:fix
npx tsc --noEmit
npm run test:ui
npm run build
npm run agent:doctor
```

### 7. Mark Completion & Session Checkpoint
- Update the checklist `- [x]` in `docs/github_issues_roadmap.md`.
- Mark task complete and log checkpoint:
  ```bash
  npm run agent:state -- --done ISSUE-N
  npm run agent:state -- --checkpoint "Successfully completed Issue #N with full verification"
  ```

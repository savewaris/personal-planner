---
name: project-planner
description: Translating user feature requests into structured GitHub Issues, milestones, acceptance criteria, and task breakdowns across any repository.
recommended_model: pro
---

# Project & Feature Planner Skill

Use this skill when drafting new product initiatives, creating structured GitHub Issues, organizing milestone roadmaps, or estimating technical complexity.

---

## Planning Framework

### 1. Issue Specification Template
When creating new items in `docs/github_issues_roadmap.md` or publishing via `create-github-issues.mjs`:

```markdown
## Issue #[N]: [Type] [Concise Feature Title]

**Labels:** `feature` / `refactor` / `bug`, `frontend` / `backend`, `ui/ux`, `database`  
**Milestone:** `vX.Y — [Milestone Name]`  
**Priority:** `High` / `Medium` / `Low`

### Description
Clear 2-3 sentence overview of user problem, feature capability, and system value.

### Technical Requirements
1. **Database / Models**: Schema changes, migrations, and fields needed.
2. **API / Backend Handlers**: New or modified endpoints, controllers, and services.
3. **Admin / Management UI**: Management interface controls and forms.
4. **Public / Consumer UI**: Visual rendering, motion physics, and responsive layouts.

### Acceptance Criteria
- [ ] Measurable, testable requirement 1
- [ ] Measurable, testable requirement 2
- [ ] 0 TypeScript / compilation errors and clean production build
- [ ] Automated tests pass with 0 errors (`npm run test:ui` / unit tests)
```

### 2. Dependency Sequencing & Risk Analysis
- Identify database migrations that could impact existing records or create lock contention.
- Identify frontend changes that affect responsive layouts or accessibility compliance.
- Sequence dependencies logically: `Schema -> API Layer -> Admin UI -> Public UI -> Verification`.

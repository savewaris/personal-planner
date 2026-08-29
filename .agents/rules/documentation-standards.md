# Documentation & Architecture Standards

## 1. Architecture Decision Records (ADRs)

- Store all major architectural and structural decisions in `docs/adr/`.
- File naming convention: `NNNN-short-title.md` (e.g. `0001-project-scoped-agents.md`).
- ADR Structure:
  1. **Title & Metadata**: Number, Date, Status (Proposed / Accepted / Superseded).
  2. **Context & Problem Statement**: Why a decision was needed.
  3. **Decision Drivers**: Goals, constraints, trade-offs.
  4. **Considered Options**: Alternative approaches evaluated.
  5. **Decision Outcome**: What was chosen and positive/negative consequences.

---

## 2. Code Comments & JSDoc

- Add JSDoc comments to public utilities and reusable hooks/components.
- Document TypeScript interfaces and component props with descriptions of purpose.
- Maintain documentation integrity: Never delete explanatory comments unless refactoring the code they describe.

---

## 3. Roadmaps & Issue Specs

- Store product features and technical issues in `docs/github_issues_roadmap.md`.
- Keep acceptance criteria clearly testable with markdown checklists (`- [ ]`).
- Reference related issue IDs when making git commits or creating pull requests.

# Master Rule: GitHub Professional Workflow & Scalable Project Architecture

## 1. Scalable Project Directory Architecture
When scaffolding or refactoring projects, ALWAYS apply this hybrid architecture:

```text
root/
├── .github/                     # GitHub Engineering Templates & Workflows
│   ├── workflows/
│   │   └── ci.yml               # Automated CI (tsc + jest + TZ=UTC)
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md        # Bug Report template
│   │   └── feature_request.md   # Feature Request template
│   ├── PULL_REQUEST_TEMPLATE.md # PR Review Checklist template
│   └── dependabot.yml           # Dependabot dependency security scanner
│
├── docs/                        # Centralized markdown specifications
│   ├── architecture/            # Requirements, system design, concept
│   ├── design/                  # Design system tokens & UI guidelines
│   ├── planning/                # Roadmaps & implementation plans
│   └── testing/                 # Test infra & coverage reports
│
├── src/
│   ├── components/              # Feature folders (tasks/, habits/) + ui/ (modals/, inputs/, badges/)
│   ├── types/                   # Centralized pure domain interfaces (task.ts, habit.ts, index.ts)
│   ├── hooks/                   # Custom React hooks (useKeyboardShortcut.ts, useToast.ts, index.ts)
│   ├── lib/                     # Server infra subfolders (db/, auth/, theme/, utils/, index.ts)
│   ├── context/                 # Global state stores
│   └── services/                # API client services
```

## 2. GitHub Professional Team Workflow Standards
- **Never Push Directly to Main**: Always create short-lived feature branches (`feat/feature-name`, `refactor/scope`).
- **Conventional Commits**: Use structured messages (`feat: ...`, `fix: ...`, `refactor: ...`, `docs: ...`).
- **GitHub Actions CI/CD**: Always include `.github/workflows/ci.yml` to automatically verify `tsc` and tests on every PR with `TZ: "UTC"`.
- **Dependabot Security**: Include `.github/dependabot.yml` for automated security scanning.
- **PR Checklist**: Include `.github/PULL_REQUEST_TEMPLATE.md`.
- **Milestone Tags**: Tag releases (`v1.0.0`, `v1.1.0`) for rollbacks and version tracking.

## 3. Automatic Generator Protocol
Whenever the user asks to "setup GitHub for a new project" or "scaffold project architecture", automatically generate the `.github/` folder suite and `src/` directory layout above!

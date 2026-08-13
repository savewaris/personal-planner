# Master Rule: GitHub Professional Workflow & Scalable Project Architecture

## 1. Scalable Project Directory Architecture
When scaffolding or refactoring projects, ALWAYS apply this hybrid architecture:

```text
root/
├── docs/                        # Centralized markdown specifications
│   ├── architecture/            # Requirements, system design, concept
│   ├── design/                  # Design system tokens & UI guidelines
│   ├── planning/                # Roadmaps & implementation plans
│   └── testing/                 # Test infra & coverage reports
├── src/
│   ├── components/              # Feature folders (tasks/, habits/) + ui/ (modals/, inputs/, badges/)
│   ├── types/                   # Centralized pure domain interfaces (task.ts, habit.ts, index.ts)
│   ├── hooks/                   # Custom React hooks (useKeyboardShortcut.ts, useToast.ts, index.ts)
│   ├── lib/                     # Server infra subfolders (db/, auth/, theme/, utils/, index.ts)
│   ├── context/                 # Global state stores
│   └── services/                # API client services
```

## 2. GitHub Professional Team Workflow
- **Never Push Directly to Main**: Always create short-lived feature branches (`feat/feature-name`, `refactor/scope`).
- **Conventional Commits**: Use structured messages (`feat: ...`, `fix: ...`, `refactor: ...`, `docs: ...`).
- **GitHub Actions CI/CD**: Include `.github/workflows/ci.yml` to automatically verify `tsc` and tests on every PR.
- **Milestone Tags**: Tag releases (`v1.0.0`, `v1.1.0`) for rollbacks and version tracking.

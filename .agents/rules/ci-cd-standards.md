# CI/CD & Build Pipeline Standards

## 1. Quality Gates (Must Pass Before Merge/Deploy)

All code pushed to GitHub or prepared for production release must pass continuous quality gates:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ 1. Schema Check │ ──> │ 2. Type Check   │ ──> │ 3. Linter / A11y│ ──> │ 4. Prod Build   │
│ Schema syntax   │     │ 0 type errors   │     │ ESLint & Tests  │     │ Clean compile   │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
```

1. **Schema & Model Validation**: Validate database and data contracts before compilation.
2. **Type Check**: 0 compiler type errors across source and scripts.
3. **Linting & Verification**: Adhere to strict linting rules and automated test suites.
4. **Production Build**: Verify all components and bundles compile cleanly.

---

## 2. GitHub Actions Workflow Conventions

- Workflows are defined in `.github/workflows/*.yml`.
- Ensure deterministic dependency installation with `npm ci || npm install` or lockfile freezing.
- Cache dependencies and framework artifacts (`.next/cache`, `node_modules`, `target`, `.venv`) to optimize runner speed.
- Secrets must be injected via repository secrets with mock fallback defaults for isolated CI runners.

---

## 3. Dependabot & Supply Chain Hygiene

- Group tightly-coupled framework packages in `.github/dependabot.yml` to prevent version mismatch.
- Configure weekly dependency updates with automated PR validation.

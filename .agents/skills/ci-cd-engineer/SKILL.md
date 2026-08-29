---
name: ci-cd-engineer
description: Authoring, maintaining, scaffolding, and verifying production-grade GitHub Actions CI/CD pipelines, security gates, automated tests, and release workflows. Activate this skill when configuring CI/CD, Gitleaks, Dependabot, PR hygiene, or automated releases.
---

# CI/CD & Build Engineer Skill

This skill provides production runbooks for configuring, scaffolding, and validating GitHub Actions CI/CD pipelines across the full Software Development Life Cycle (SDLC).

---

## 1. Automated Scaffolding Command

To stamp the full SDLC CI/CD suite into any repository automatically:

```powershell
# Auto-detect stack and stamp baseline + extensions:
powershell -ExecutionPolicy Bypass -File "C:\agent-second-brain\scripts\scaffold-cicd.ps1" -TargetPath "<Project Root>"

# Or specify stack explicitly:
powershell -ExecutionPolicy Bypass -File "C:\agent-second-brain\scripts\scaffold-cicd.ps1" -TargetPath "<Project Root>" -Stack "nextjs"
```

---

## 2. Universal 4-Pillar Baseline Structure

Every project repository receives these 4 core assets:

| File | Purpose | Key Checks |
| :--- | :--- | :--- |
| `.github/workflows/ci.yml` | Quality Gate | Dependency install (`npm ci`), Prisma validate, `tsc --noEmit`, ESLint, `agent:doctor`, `npm run build` |
| `.github/workflows/security-scan.yml` | Security Gate | Gitleaks secret leak detection, `npm audit` dependency vulnerabilities, weekly cron scan |
| `.github/workflows/pr-hygiene.yml` | PR Governance | Conventional Commits PR title validation (`feat:`, `fix:`, `refactor:`, `docs:`) |
| `.github/dependabot.yml` | Supply Chain Security | Weekly automated npm & GitHub Actions dependency updates |
| `.github/PULL_REQUEST_TEMPLATE.md` | Code Review Standard | Pull request verification checklist & security gates |

---

## 3. Modular Extension Layers

1. **Web & UI/UX (`.github/workflows/ui-ux-e2e.yml`)**:
   - Automated Playwright E2E testing
   - WCAG 2.2 accessibility scan
   - Responsive layout overflow checks across Mobile, Tablet, Desktop
   - HTML test report upload to GitHub Actions artifacts
2. **Release & Changelog (`.github/workflows/release.yml`)**:
   - Automated semantic versioning and changelog notes on `main` merge

---

## 4. Local Pre-Flight CI Verification

Before pushing to remote or opening a PR, always execute the local quality gate:
```bash
npx prisma validate
npx tsc --noEmit
npm run lint
node scripts/agent-doctor.mjs
npm run test:ui
npm run build
```

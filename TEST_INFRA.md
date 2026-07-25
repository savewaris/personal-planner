# Test Architecture & Infrastructure (`TEST_INFRA.md`)

## Overview

The Planner application testing infrastructure is an opaque-box automated test suite designed around a two-layered testing model:
1. **Unit & API Route Handler Level (Jest)**: Fast, isolated verification of business logic, input validation, session state, streak calculations, and API contracts.
2. **End-to-End Browser Level (Playwright)**: Full browser automation testing UI rendering, context switching, task filtering, habit logging, dynamic theming, and real-world multi-context user flows.

---

## Directory Structure

```
d:/save/Antigravity/Planner/
├── jest.config.js               # Jest configuration (ts-jest preset, alias resolution, testMatch)
├── playwright.config.ts         # Playwright E2E configuration (Chromium target, baseURL, webServer)
├── package.json                 # Test execution scripts (test, test:unit, test:e2e)
├── tests/
│   ├── jest/                    # Jest Unit & Route Handler Test Suites
│   │   ├── tier1/
│   │   │   ├── auth.test.ts     # Tier 1: Auth Feature Coverage (6 tests)
│   │   │   ├── contexts.test.ts # Tier 1: Context Switcher Coverage (6 tests)
│   │   │   ├── tasks.test.ts    # Tier 1: Unified Task List Coverage (6 tests)
│   │   │   └── habits.test.ts   # Tier 1: Habit Tracker Coverage (6 tests)
│   │   ├── tier2/
│   │   │   └── boundary.test.ts # Tier 2: Boundary & Corner Cases (8 tests)
│   │   └── tier3/
│   │       └── cross-feature.test.ts # Tier 3: Cross-Feature Integration (5 tests)
│   └── e2e/                     # Playwright Browser E2E Test Suites
│       ├── tier1-auth.spec.ts
│       ├── tier1-contexts.spec.ts
│       ├── tier1-tasks.spec.ts
│       ├── tier1-habits.spec.ts
│       ├── tier2-boundary.spec.ts
│       ├── tier3-cross-feature.spec.ts
│       └── tier4-real-world.spec.ts # Tier 4: Full Multi-Context User Workflow
```

---

## Test Tier Inventory

| Tier | Category | Scope & Feature Coverage | Test Suite Location |
|------|----------|--------------------------|---------------------|
| **Tier 1** | Feature Coverage (≥5 tests/feature) | **Auth**: User registration, login, session inspection, logout, credential validation.<br>**Context Switcher**: Context creation, switching, dynamic theme classes, filtering, deletion.<br>**Task List**: Task creation, filtering by context, aggregated "All Contexts" view, completion toggle, deletion.<br>**Habit Tracker**: Habit creation, daily log logging, consecutive streak calculation, streak reset on missed days, unchecking logs. | `tests/jest/tier1/`<br>`tests/e2e/tier1-*.spec.ts` |
| **Tier 2** | Boundary & Corner Cases | Empty/whitespace context names, max length context/task inputs (255+ chars), invalid login inputs, non-existent resource IDs, streak calculations across month boundaries, leap years, duplicate date logs. | `tests/jest/tier2/boundary.test.ts`<br>`tests/e2e/tier2-boundary.spec.ts` |
| **Tier 3** | Cross-Feature Combinations | Switching context during task creation, global habit tracker accessibility across context toggles, task reassignment on context deletion, task state persistence across workspace switches. | `tests/jest/tier3/cross-feature.test.ts`<br>`tests/e2e/tier3-cross-feature.spec.ts` |
| **Tier 4** | Real-World Application Scenarios | Complete end-to-end multi-context user workflow: User login -> create contexts ("Work", "Personal") -> add tasks per context -> view aggregated tasks in "All Contexts" -> log daily habit -> verify streak counter. | `tests/e2e/tier4-real-world.spec.ts` |

---

## Environment & Execution Scripts

- **`npm run test`**: Runs the complete test pipeline (Unit/API tests via Jest + Browser E2E tests via Playwright).
- **`npm run test:unit`**: Runs Jest unit and API route handler test suites (`npx jest`).
- **`npm run test:e2e`**: Runs Playwright browser E2E test suites (`npx playwright test`).

---

## Verification & Compliance

- **AAA Pattern**: All Jest unit tests structure setup, execution, and assertion strictly following Arrange-Act-Assert.
- **Selector Robustness**: Playwright E2E tests leverage resilient data attributes (`data-testid`), ARIA roles, and visible text fallbacks.
- **Isolated State**: Test state is cleared and isolated using `beforeEach` hooks across all test files.

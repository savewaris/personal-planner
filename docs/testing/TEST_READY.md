# Test Suites Scaffolding & Execution Guide (`TEST_READY.md`)

## Status: READY

The opaque-box E2E testing infrastructure for Planner application has been fully configured and scaffolded across all 4 tiers using Jest and Playwright.

---

## Test Suites Summary

| Test Suite | Framework | Scope / Tier | File Location | Status |
|------------|-----------|--------------|---------------|--------|
| **Auth Feature Suite** | Jest | Tier 1 Unit & Route Handler | `tests/jest/tier1/auth.test.ts` | READY |
| **Context Switcher Suite** | Jest | Tier 1 Unit & Route Handler | `tests/jest/tier1/contexts.test.ts` | READY |
| **Task List Suite** | Jest | Tier 1 Unit & Route Handler | `tests/jest/tier1/tasks.test.ts` | READY |
| **Habit Tracker Suite** | Jest | Tier 1 Unit & Route Handler | `tests/jest/tier1/habits.test.ts` | READY |
| **Boundary & Corner Cases** | Jest | Tier 2 Edge Cases & Validation | `tests/jest/tier2/boundary.test.ts` | READY |
| **Cross-Feature Integration** | Jest | Tier 3 Logic Combinations | `tests/jest/tier3/cross-feature.test.ts` | READY |
| **Auth E2E Flow** | Playwright | Tier 1 Browser Flow | `tests/e2e/tier1-auth.spec.ts` | READY |
| **Context Switcher E2E** | Playwright | Tier 1 Browser Flow | `tests/e2e/tier1-contexts.spec.ts` | READY |
| **Task List E2E** | Playwright | Tier 1 Browser Flow | `tests/e2e/tier1-tasks.spec.ts` | READY |
| **Habit Tracker E2E** | Playwright | Tier 1 Browser Flow | `tests/e2e/tier1-habits.spec.ts` | READY |
| **Boundary E2E Cases** | Playwright | Tier 2 Browser Boundaries | `tests/e2e/tier2-boundary.spec.ts` | READY |
| **Cross-Feature E2E** | Playwright | Tier 3 Browser Combinations | `tests/e2e/tier3-cross-feature.spec.ts` | READY |
| **Real-World E2E Workflow** | Playwright | Tier 4 Full End-to-End Workflow | `tests/e2e/tier4-real-world.spec.ts` | READY |

---

## How to Execute Tests

### 1. Run Complete Test Suite (Jest + Playwright)
```bash
npm test
```

### 2. Run Jest Unit & Route Handler Tests
```bash
npm run test:unit
```
To run a specific Jest test file:
```bash
npx jest tests/jest/tier1/auth.test.ts
```

### 3. Run Playwright Browser E2E Tests
```bash
npm run test:e2e
```
To run Playwright in UI mode for interactive debugging:
```bash
npx playwright test --ui
```
To run a specific Playwright spec:
```bash
npx playwright test tests/e2e/tier4-real-world.spec.ts
```

---

## Test Coverage Inventory

- **Tier 1 (Feature Coverage)**: ≥5 tests per feature covering Auth, Context Switcher, Task List, and Habit Tracker.
- **Tier 2 (Boundary & Corner Cases)**: Empty names, max length inputs (255+ chars), invalid login inputs, missing resource IDs, streak calculations across month boundaries & leap years.
- **Tier 3 (Cross-Feature Combinations)**: Context switching during task creation, global habits across workspace switches, task reassignment on context deletion.
- **Tier 4 (Real-World Application Scenarios)**: Multi-context workflow from user login to context creation, task aggregation, habit completion, and streak verification.

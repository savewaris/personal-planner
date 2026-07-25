# Empirical Findings & Handoff Report — Challenger 2

## 1. Observation

### System Verification Commands
- Command: `npx tsc --noEmit`
  - Result: Exit code 0, no compilation errors.
- Command: `npm run test:unit`
  - Result: Exit code 0, 56/56 unit tests passed across 7 test suites (including newly created empirical stress test file `tests/jest/tier2/challenger_streak_tasks.test.ts`).

### Source Inspection & Code Quotes

#### A. Streak Calculation Algorithm (`src/lib/streak.ts`)
- Lines 11–14:
  ```ts
  export function formatDateKey(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
  }
  ```
- Lines 26–48:
  ```ts
  export function calculateStreak(logs: HabitLogInput[], refDate: Date = new Date()): number {
    const completedDates = logs
      .filter((log) => log.completed)
      .map((log) => formatDateKey(log.date));

    if (completedDates.length === 0) {
      return 0;
    }

    const sortedDates = Array.from(new Set(completedDates)).sort((a, b) => (a < b ? 1 : -1));

    const todayStr = formatDateKey(refDate);
    const yesterdayDate = new Date(refDate.getTime());
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = formatDateKey(yesterdayDate);

    const latestCompletedDate = sortedDates[0];

    if (latestCompletedDate !== todayStr && latestCompletedDate !== yesterdayStr) {
      return 0;
    }
  ```
- Lines 50–66:
  ```ts
    let streak = 0;
    const [y, m, d] = latestCompletedDate.split('-').map(Number);
    let currentDate = new Date(Date.UTC(y, m - 1, d));

    for (const logDateStr of sortedDates) {
      const expectedStr = currentDate.toISOString().split('T')[0];

      if (logDateStr === expectedStr) {
        streak++;
        currentDate.setUTCDate(currentDate.getUTCDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }
  ```

#### B. Task Aggregation Filtering (`src/app/api/tasks/route.ts`)
- Lines 13–24:
  ```ts
  const { searchParams } = new URL(req.url);
  const contextId = searchParams.get('contextId');

  const whereClause: any = {
    context: {
      userId: session.user.id,
    },
  };

  if (contextId && contextId.trim() !== '') {
    whereClause.contextId = contextId;
  }
  ```

---

## 2. Logic Chain

### A. Streak Calculation Algorithm Stress Test Analysis
1. **Year Boundary Handling (Dec 31 ↔ Jan 1)**:
   - *Observation*: `calculateStreak` initializes `currentDate` using `Date.UTC(y, m - 1, d)` and decrements days using `currentDate.setUTCDate(currentDate.getUTCDate() - 1)`.
   - *Logic*: In JS Date UTC methods, `Date.UTC(2026, 0, 1)` minus 1 day becomes `2025-12-31`.
   - *Empirical Result*: Test case with logs `['2025-12-30', '2025-12-31', '2026-01-01', '2026-01-02']` and `refDate = 2026-01-02T12:00:00Z` yields `streak = 4`. PASS.

2. **Leap Year Handling (Feb 28 ↔ Feb 29 ↔ Mar 1)**:
   - *Observation*: `setUTCDate` uses standard Gregorian calendar rules.
   - *Logic*: In leap year 2024, `2024-03-01` minus 1 day is `2024-02-29`, and `2024-02-29` minus 1 day is `2024-02-28`. In non-leap year 2025, `2025-03-01` minus 1 day is `2025-02-28`.
   - *Empirical Result*: `calculateStreak` returns `3` for leap year 2024 logs `['2024-02-28', '2024-02-29', '2024-03-01']`, and returns `2` for non-leap year 2025 logs `['2025-02-28', '2025-03-01']`. PASS.

3. **Multiple Completions on Same Day**:
   - *Observation*: `logs.filter(log => log.completed).map(...)` maps log dates, then `Array.from(new Set(completedDates))` removes duplicate date strings.
   - *Logic*: Regardless of how many completion entries exist for a single date (e.g. 3 completions on `2026-07-21`), `Set` deduplicates them into a single string `"2026-07-21"`.
   - *Empirical Result*: Multiple logs on `2026-07-21` yield `streak = 1` (or `2` if previous day completed). Uncompleted logs (`completed: false`) are ignored. PASS.

4. **Missed Days & Streak Reset**:
   - *Observation*: `if (latestCompletedDate !== todayStr && latestCompletedDate !== yesterdayStr)` returns `0`. Inside the loop, `if (logDateStr === expectedStr)` breaks immediately when a date is missing.
   - *Logic*: Gaps in completed dates halt the increment loop and return only consecutive days from the latest completion date. If the latest completion is 2+ days older than `refDate`, streak resets to 0.
   - *Empirical Result*: PASS.

5. **TIMEZONE EDGE CASE (Confirmed Flaw)**:
   - *Observation*: `formatDateKey` calls `d.toISOString().split('T')[0]`. `refDate` defaults to `new Date()`.
   - *Logic*:
     1. If a user logs a habit for `"2026-07-21"` (a simple date string without timezone), `formatDateKey("2026-07-21")` produces `"2026-07-21"`.
     2. If the user evaluates the streak at 1:00 AM local time on July 21st in UTC+7 (e.g., `2026-07-21T01:00:00+07:00`), `refDate.toISOString()` resolves to `2026-07-20T18:00:00.000Z`.
     3. Thus `todayStr` is evaluated as `"2026-07-20"` and `yesterdayStr` as `"2026-07-19"`.
     4. `latestCompletedDate` (`"2026-07-21"`) is neither `"2026-07-20"` nor `"2026-07-19"`.
     5. `calculateStreak` returns **0**, resetting the user's streak to 0 even though they completed the habit today!
   - *Empirical Result*: Confirmed empirically in `tests/jest/tier2/challenger_streak_tasks.test.ts`.

### B. Task Aggregation Filtering Stress Test Analysis
1. **Omitted / Empty `contextId`**:
   - *Observation*: `GET /api/tasks` or `GET /api/tasks?contextId=` produces `contextId = null` or `contextId = ""`.
   - *Logic*: `if (contextId && contextId.trim() !== '')` evaluates to `false`. `whereClause` is `{ context: { userId: session.user.id } }`.
   - *Empirical Result*: All tasks across all contexts for the user are fetched and aggregated. PASS.

2. **Specific Context ID Filter**:
   - *Observation*: `GET /api/tasks?contextId=ctx_work` sets `whereClause.contextId = 'ctx_work'`.
   - *Logic*: Prisma filters tasks strictly by `contextId = 'ctx_work'`.
   - *Empirical Result*: PASS.

3. **LITERAL STRING `"null"` / `"undefined"` VULNERABILITY**:
   - *Observation*: Client requests `GET /api/tasks?contextId=null` (e.g. from frontend JS string interpolation `${activeContextId}`).
   - *Logic*: `searchParams.get('contextId')` returns primitive string `"null"`. `"null"` is truthy and non-empty, so `if (contextId && contextId.trim() !== '')` evaluates to `true`. `whereClause.contextId` is set to `"null"`.
   - *Empirical Result*: Prisma executes query `WHERE task.contextId = 'null'`. Since no context has ID `'null'`, it returns an empty array `[]` instead of aggregating all tasks!

4. **UNTRIMMED QUERY PARAM VULNERABILITY**:
   - *Observation*: `if (contextId && contextId.trim() !== '') { whereClause.contextId = contextId; }` checks `contextId.trim()`, but assigns raw `contextId` (untrimmed).
   - *Logic*: `GET /api/tasks?contextId=%20ctx_work%20` sets `whereClause.contextId = ' ctx_work '`.
   - *Empirical Result*: Mismatch with database context ID `'ctx_work'`.

---

## 3. Caveats
- E2E browser timezone testing (e.g. Playwright with mock timezone headers or system clock modification) was not run in real browser environments during this unit pass; findings are proven via Node/Jest unit environment execution.
- No other caveats.

---

## 4. Conclusion

### Final Assessment
- Pure UTC date logic for streak calculation (`src/lib/streak.ts`) correctly handles year boundaries, leap years, multiple completions per day, and missed day resets.
- However, **two significant edge-case flaws were empirically identified**:
  1. **Timezone Offset Mismatch in Streak Calculation**: Using `.toISOString()` on local `Date` objects (`refDate`) causes early-morning or late-evening local time checks to shift date boundaries relative to `YYYY-MM-DD` log strings, resulting in false streak resets (returning `0`).
  2. **Task Aggregation Query Parameter Handling**: `GET /api/tasks?contextId=null` treats string `"null"` as a valid context ID filtering for `contextId === 'null'`, rather than recognizing it as empty/all-contexts. Additionally, untrimmed query strings are directly passed to Prisma where clauses.

---

## 5. Verification Method

### How to Reproduce & Verify
1. Run the test suite:
   ```bash
   npm run test:unit
   ```
2. Inspect `tests/jest/tier2/challenger_streak_tasks.test.ts` for the empirical test cases:
   - `demonstrates vulnerability: refDate with non-UTC offset causes date shift in formatDateKey`
   - `vulnerability test: contextId=null as literal string filters for contextId === "null"`
   - `vulnerability test: contextId with untrimmed whitespace is stored untrimmed in query`
3. Run TypeScript validation:
   ```bash
   npx tsc --noEmit
   ```

---

## Adversarial Challenge Report

### Challenge Summary
**Overall risk assessment**: MEDIUM

### Challenges

#### 1. [Medium] Timezone Date Shift in `formatDateKey` & `refDate`
- **Assumption challenged**: `formatDateKey(date)` using `date.toISOString().split('T')[0]` assumes all dates are evaluated in UTC.
- **Attack scenario**: User in timezone UTC+7 evaluates habit streak at 1:00 AM local time on July 21 (`2026-07-21T01:00:00+07:00`). `refDate.toISOString()` yields `"2026-07-20"`. Habit logged for July 21 (`"2026-07-21"`) is compared against `todayStr="2026-07-20"` and `yesterdayStr="2026-07-19"`.
- **Blast radius**: Habit streak incorrectly drops to 0 for users in non-UTC timezones during certain hours.
- **Mitigation**: Standardize date formatting using local date components (`d.getFullYear()`, `d.getMonth()`, `d.getDate()`) or explicit UTC date strings across both habit logs and `refDate`.

#### 2. [Medium] Literal `"null"` or `"undefined"` String Query Parameter in Task API
- **Assumption challenged**: `searchParams.get('contextId')` assumes `contextId` is either `null` (omitted) or a valid context ID string.
- **Attack scenario**: Frontend sends `GET /api/tasks?contextId=null` when `activeContextId` is `null` (e.g. `fetch('/api/tasks?contextId=' + activeContextId)`).
- **Blast radius**: API returns empty task list `[]` instead of aggregating all tasks across contexts.
- **Mitigation**: Sanitize `contextId` query parameter in `src/app/api/tasks/route.ts`:
  ```ts
  const rawContextId = searchParams.get('contextId');
  const contextId = rawContextId && rawContextId.trim() !== '' && rawContextId !== 'null' && rawContextId !== 'undefined'
    ? rawContextId.trim()
    : null;
  ```

### Stress Test Results
- Year boundary (Dec 31 -> Jan 1) → expected 4 day streak → actual 4 day streak → PASS
- Leap year (Feb 28 -> Feb 29 -> Mar 1 in 2024) → expected 3 day streak → actual 3 day streak → PASS
- Non-leap year (Feb 28 -> Mar 1 in 2025) → expected 2 day streak → actual 2 day streak → PASS
- Multiple completions on same day → expected deduplication → actual 1 count per day → PASS
- Missed day gap → expected streak break → actual streak break → PASS
- Non-UTC `refDate` (UTC+7 1am) → expected streak 1 → actual streak 0 → FAIL (Vulnerability reproduced)
- `GET /api/tasks?contextId=null` → expected all tasks aggregated → actual `whereClause.contextId = 'null'` → FAIL (Vulnerability reproduced)

### Unchallenged Areas
- E2E Playwright browser testing with full DB integration (covered by Tier 1-4 spec files in `tests/e2e/`).

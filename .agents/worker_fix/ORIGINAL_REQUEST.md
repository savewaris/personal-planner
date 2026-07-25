## 2026-07-23T03:13:39Z

You are worker_fix.
Working Directory: d:/save/Antigravity/Planner/.agents/worker_fix
Identity: teamwork_preview_worker

Your mission:
Fix the two empirical edge-case vulnerabilities identified by Challenger 2 and verify the entire system.

### Vulnerability 1: Timezone Date Offset Mismatch in `src/lib/streak.ts`
- **File**: `d:/save/Antigravity/Planner/src/lib/streak.ts`
- **Issue**: `formatDateKey` uses `toISOString().split('T')[0]` which formats dates in UTC. When `refDate` (e.g. `new Date()`) is evaluated in a non-UTC timezone (or at times like 1:00 AM UTC+7), `toISOString()` shifts the date string back by 1 day (e.g. July 21 01:00 UTC+7 -> July 20 18:00 UTC), causing `latestCompletedDate !== todayStr && latestCompletedDate !== yesterdayStr` to evaluate true and reset the user's streak to 0.
- **Fix**: Update `formatDateKey` or `calculateStreak` so date comparison between log dates (`YYYY-MM-DD` strings) and `refDate` evaluates local date components (or consistently standardizes UTC date representation) so local date boundaries do not trigger false streak resets. Ensure all 56 existing unit tests in `npm run test:unit` pass!

### Vulnerability 2: Query Parameter Sanitization in `src/app/api/tasks/route.ts`
- **File**: `d:/save/Antigravity/Planner/src/app/api/tasks/route.ts`
- **Issue**: In `GET /api/tasks`, when `contextId` query parameter is literal `"null"` or `"undefined"` (e.g., `GET /api/tasks?contextId=null`), `if (contextId && contextId.trim() !== '')` evaluates true and filters `whereClause.contextId = 'null'`, returning an empty array `[]` instead of aggregating all tasks across contexts. Also untrimmed query strings like `?contextId=%20ctx_1%20` are passed untrimmed.
- **Fix**: Sanitize `contextId` query parameter in `src/app/api/tasks/route.ts`:
  `const rawContextId = searchParams.get('contextId');`
  `const contextId = rawContextId && rawContextId.trim() !== '' && rawContextId !== 'null' && rawContextId !== 'undefined' ? rawContextId.trim() : null;`

### Verification Steps:
1. Run `npx tsc --noEmit` to verify 0 TypeScript errors.
2. Run `npm run test:unit` to verify all 56+ Jest unit and route tests pass 100%.
3. Run `npm run build` to verify Next.js build succeeds with 0 compilation errors.

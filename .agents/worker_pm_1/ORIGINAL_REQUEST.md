## 2026-07-23T03:40:01Z
<USER_REQUEST>
You are Worker PM-1. Your working directory is d:/save/Antigravity/Planner/.agents/worker_pm_1.

Your objective is to implement the Personal Mode Transition requirements (R1, R2, R3, R4):

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Specific Tasks:
1. R1. Personal Mode Auth Bypass & Auto-Seeding:
   - Create/update a local user helper (e.g. getOrCreateLocalUser() in src/lib/auth.ts or src/lib/localUser.ts) that uses Prisma client (src/lib/prisma.ts) to ensure a User with id: "local", email: "local@personal.mode", name: "Personal User" exists in the database.
   - If missing, seed the user and a default Context (name: "Personal", color: "indigo", userId: "local").
   - Return "local" as the active userId.

2. R2. Instant Access Navbar & Dashboard:
   - Refactor src/components/Navbar.tsx: Remove useSession, signOut, login/signup buttons, and user dropdown menu. Render brand logo ('Planner'), <ContextSwitcher variant="dropdown" />, and a 'Personal Mode' badge.
   - Refactor src/app/page.tsx: Remove useSession and <HeroSection />. Land directly on the workspace dashboard rendering <TaskList /> and <HabitTracker />.
   - Refactor src/app/login/page.tsx: Make it immediately redirect to / using redirect("/") from next/navigation or client-side useEffect.
   - Refactor src/components/Providers.tsx: Simplify without <SessionProvider>.

3. R3. API Route Simplification:
   - Refactor /api/contexts/route.ts & [id]/route.ts: Remove NextAuth session checks and 401 unauthorized checks. Call getOrCreateLocalUser() (or use userId: "local"), and auto-seed default "Personal" context if no contexts exist.
   - Refactor /api/tasks/route.ts & [id]/route.ts: Remove session checks and 401 checks. Query and mutate tasks using userId: "local".
   - Refactor /api/habits/route.ts & [id]/log/route.ts: Remove session checks and 401 checks. Query and mutate habits using userId: "local".

4. R4. Verification & Test Updates:
   - Refactor unit test specs in tests/jest/:
     - tests/jest/tier1/auth.test.ts: Test getOrCreateLocalUser() and single-user Personal Mode resolution (userId: "local").
     - Update hardcoded mock user IDs in habits.test.ts, challenger_streak_tasks.test.ts, cross-feature.test.ts from usr_123/usr_1 to local.
   - Refactor E2E test specs in tests/e2e/:
     - tier1-auth.spec.ts: Test direct dashboard access on / without login forms or logout buttons.
     - tier4-real-world.spec.ts: Remove /login credential submission step, start test directly on /.
   - Execute verification commands:
     - npm run test (or npx jest) to confirm 100% unit test pass rate.
     - npm run build to confirm 0 compile errors.

Document all modified files and implementation details in d:/save/Antigravity/Planner/.agents/worker_pm_1/changes.md.
Write a 5-component handoff report in d:/save/Antigravity/Planner/.agents/worker_pm_1/handoff.md.
Send a message to parent when finished.
</USER_REQUEST>

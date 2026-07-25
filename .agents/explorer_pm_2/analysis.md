# Comprehensive Analysis & Strategy: Personal Mode Transition (R2 & R4)

**Author:** Explorer PM-2  
**Date:** July 23, 2026  
**Target Workspace:** `d:/save/Antigravity/Planner/`  

---

## 1. Executive Summary

This report provides a complete, read-only architectural analysis and test audit for transitioning the **Planner** application to single-user **Personal Mode** (`userId: "local"`), addressing requirements **R2 (Instant Access Navbar & Dashboard)** and **R4 (Automated Verification Audit)**.

Key findings:
- **R2 (UI & Routing):** 
  - `src/components/Navbar.tsx` currently depends on `useSession()` from `next-auth/react` and renders conditional UI for `unauthenticated` ("Sign In", "Get Started") and `authenticated` ("Sign Out" dropdown). In Personal Mode, session status checks, login buttons, sign-out actions, and NextAuth session dependencies must be removed. The Navbar should statically present the brand logo ("Planner") and the Context Switcher (`<ContextSwitcher variant="dropdown" />`).
  - `src/app/page.tsx` currently renders a `<HeroSection />` with sign-in prompts when `status === "unauthenticated"`. In Personal Mode, the session check and `HeroSection` are eliminated so that the user lands directly on the workspace dashboard, rendering `<TaskList />` and `<HabitTracker />` immediately.
  - `src/app/login/page.tsx` is an auth page (411 lines) handling credentials, OAuth, and magic links. For Personal Mode, direct visits to `/login` should immediately redirect to `/` via Next.js `redirect("/")`.
  - No custom `middleware.ts` file exists in the repository.
  - `src/context/ContextSwitcherContext.tsx` handles context state via `/api/contexts` and is fully functional without requiring session headers when the backend endpoints resolve `userId: "local"`.
- **R4 (Automated Verification):**
  - **Jest Unit Tests (`tests/jest/`):** 7 test files audited. `tests/jest/tier1/auth.test.ts` tests multi-provider NextAuth session options and bcrypt verification; it must be refactored to test Personal Mode local session resolution (`userId: "local"`). `habits.test.ts`, `challenger_streak_tasks.test.ts`, and `cross-feature.test.ts` hardcode mock user IDs (`usr_123`, `usr_1`); these must be updated to use `"local"`.
  - **Playwright E2E Tests (`tests/e2e/`):** 7 test files audited. `tier1-auth.spec.ts` and `tier4-real-world.spec.ts` currently navigate to `/login`, fill credentials, click submit, or look for sign-out buttons. These must be updated so all E2E specs start directly at `/` without credential forms or sign-in prompts, verifying instant dashboard access in Personal Mode.
  - **Package Scripts:** `npm run test` executes `npm run test:unit && npm run test:e2e`. `npm run build` runs `next build`. All scripts remain standard and ready for execution once UI and test files are updated.

---

## 2. Detailed UI & Routing Analysis (Requirement R2)

### 2.1 Component: `src/components/Navbar.tsx`
- **Location:** `src/components/Navbar.tsx` (145 lines)
- **Current Behavior:**
  - Lines 5, 9: Imports `useSession, signOut` from `next-auth/react` and invokes `useSession()`.
  - Lines 60–76: Renders "Sign In" (`/login?tab=signin`) and "Get Started" (`/login?tab=signup`) buttons when `status === "unauthenticated"`.
  - Lines 78–139: Renders user avatar and dropdown menu containing "Sign Out" button calling `signOut({ callbackUrl: "/login" })` when `status === "authenticated"`.
  - Line 56–58: Renders a loading pulse skeleton when `status === "loading"`.
- **Required Personal Mode Changes:**
  - Remove imports of `useSession` and `signOut` from `next-auth/react`.
  - Remove dropdown state (`dropdownOpen`), outside click handler, and conditional status checks (`status === "loading"`, `status === "unauthenticated"`, `status === "authenticated"`).
  - Remove "Sign In", "Get Started", and "Sign Out" buttons completely.
  - Simplify the Navbar layout to a clean, permanent header containing:
    1. Brand Logo & Title (`Planner` link to `/`).
    2. Context Switcher (`<ContextSwitcher variant="dropdown" />`).
    3. Optional Personal Mode indicator pill (e.g. `<span className="text-xs text-zinc-500 font-medium px-3 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full">Personal Mode</span>` or static user avatar).

### 2.2 Component: `src/app/page.tsx`
- **Location:** `src/app/page.tsx` (161 lines)
- **Current Behavior:**
  - Line 4, 105: Imports `useSession` and calls `const { status } = useSession()`.
  - Lines 10–102: Defines `<HeroSection />` with marketing cards and links to `/login` and `/login?tab=signin`.
  - Lines 128–146: Renders `<HeroSection />` if `status === "unauthenticated"`, a loading spinner if `status === "loading"`, and `<TaskList />` / `<HabitTracker />` only when authenticated.
- **Required Personal Mode Changes:**
  - Remove import of `useSession` and call to `useSession()`.
  - Remove `<HeroSection />` component (or deprecate it from render path).
  - Simplify `Home()` component so it unconditionally renders the workspace dashboard:
    1. Header ("Dashboard" title + subtitle).
    2. Context Switcher pills (`<ContextSwitcher variant="pills" />`).
    3. Unified Task List (`<TaskList />`).
    4. Habit Tracker (`<HabitTracker />`).
  - Result: Loading the root URL (`/`) immediately displays all workspace tools with full access to Context Switcher, Task List, and Habit Tracker without login buttons or sign-in prompts.

### 2.3 Page & Routing: `src/app/login/page.tsx` & Middleware
- **Location:** `src/app/login/page.tsx` (411 lines)
- **Current Behavior:**
  - Contains sign-in, sign-up, magic link, and OAuth login forms with next-auth calls.
- **Middleware Check:**
  - `middleware.ts` does **not** exist in the repository root or `src/`.
- **Required Personal Mode Changes:**
  - Update `src/app/login/page.tsx` to automatically redirect users to `/` using Next.js `redirect("/")` from `next/navigation` or client-side `useEffect(() => { router.replace("/"); }, [])`. This ensures any legacy bookmark or direct URL access to `/login` seamlessly redirects to the main dashboard.

### 2.4 State Management & Providers: `src/components/Providers.tsx` & `src/context/ContextSwitcherContext.tsx`
- **Location:** `src/components/Providers.tsx` (22 lines)
- **Current Behavior:**
  - `Providers.tsx` wraps children in `<SessionProvider session={session}>` and `<ContextSwitcherProvider>`.
  - `ContextSwitcherContext.tsx` fetches workspace contexts via `/api/contexts` on mount and stores active context ID in `localStorage` (`planner_active_context_id`).
- **Required Personal Mode Changes:**
  - `ContextSwitcherContext` requires **no structural changes**; it already cleanly makes fetch calls to `/api/contexts`, `/api/contexts/[id]`. Once backend API endpoints assume single-user mode (`userId: "local"`), context switching, creation, editing, and deletion work out-of-the-box.
  - In `Providers.tsx`, `<SessionProvider>` can be removed or simplified so no NextAuth session provider polling occurs.

---

## 3. Automated Verification Audit (Requirement R4)

### 3.1 Audit of Jest Unit & Integration Tests (`tests/jest/`)

| File Path | Total Lines | Current Auth / Session Dependency | Required Adaptation for Personal Mode (`userId: "local"`) | Risk Level |
|---|---|---|---|---|
| `tests/jest/tier1/auth.test.ts` | 146 | Tests 4 NextAuth providers, bcrypt hashing, `CredentialsProvider.authorize`, session mock (`usr_123`, `usr_999`), login failure, logout. | **High adaptation needed.** Update tests to verify Personal Mode user resolution: single local user session (`userId: "local"`), auto-resolution of default personal user, and removal/deprecation of password verification requirements. | High |
| `tests/jest/tier1/contexts.test.ts` | 117 | Generic context unit logic (create, switch, theme class, filter, update, delete). | **Minor update.** Ensure context objects and API response schemas reflect `userId: "local"`. | Low |
| `tests/jest/tier1/habits.test.ts` | 174 | Tests habit creation, logging, streak calculation, streak reset, unchecking. Uses `mockUserId = 'usr_123'`. | **Minor update.** Change `mockUserId = 'usr_123'` to `mockUserId = 'local'` to align with Personal Mode contract. | Low |
| `tests/jest/tier1/tasks.test.ts` | 134 | Tests task creation, listing, context filtering, completion toggle, deletion, metadata update. | **No breaking logic.** Pure task model tests. Ensure default context owner is `"local"`. | Low |
| `tests/jest/tier2/boundary.test.ts` | 182 | Boundary inputs (context name, email format, password, task title max length, leap year streaks). | **Minor update.** Test 2.3 (`validateLoginInput`) can be adapted to test input sanitization for local user inputs or retained as legacy boundary utility test. | Low |
| `tests/jest/tier2/challenger_streak_tasks.test.ts` | 232 | Empirical stress tests for streak calculation (`calculateStreak`) and `buildTaskWhereClause` query filter. | **Minor update.** Update `buildTaskWhereClause` test assertions from `userId: 'usr_1'` to `userId: 'local'`. | Low |
| `tests/jest/tier3/cross-feature.test.ts` | 160 | Integration between contexts, tasks, habits. Uses `userId: 'usr_1'`. | **Minor update.** Update `userId` in test assertions to `'local'`. | Low |

### 3.2 Audit of Playwright E2E Tests (`tests/e2e/`)

| File Path | Total Lines | Current Flow / Login Dependencies | Required Adaptation for Personal Mode | Risk Level |
|---|---|---|---|---|
| `tests/e2e/tier1-auth.spec.ts` | 59 | Navigates to `/login`, fills email/password, checks error messages, checks user profile & logout button. | **Major refactor.** Rename/update spec to test Personal Mode Instant Access: verify visiting `/` or `/login` directly loads dashboard, verify absence of sign-in/sign-up forms, sign-out buttons, and verify local user workspace initialization. | High |
| `tests/e2e/tier1-contexts.spec.ts` | 55 | `page.goto('/')`, tests context switcher, creation, dropdown, theme class. | **No breaking changes.** Ensure selectors match updated `Navbar.tsx` and `page.tsx` layout. | Low |
| `tests/e2e/tier1-habits.spec.ts` | 55 | `page.goto('/')`, tests habit tracker, creation, check/uncheck, streak counter. | **No breaking changes.** Runs directly on `/` without login. | Low |
| `tests/e2e/tier1-tasks.spec.ts` | 48 | `page.goto('/')`, tests task list, creation, checkbox toggle, filtering, deletion. | **No breaking changes.** Runs directly on `/` without login. | Low |
| `tests/e2e/tier2-boundary.spec.ts` | 47 | `page.goto('/')`, boundary inputs, double clicks, 404 routing. | **No breaking changes.** Runs directly on `/` without login. | Low |
| `tests/e2e/tier3-cross-feature.spec.ts` | 60 | `page.goto('/')`, multi-context task creation, habit tracker persistence. | **No breaking changes.** Runs directly on `/` without login. | Low |
| `tests/e2e/tier4-real-world.spec.ts` | 76 | Step 1 navigates to `/login`, fills credentials (`user@planner.app`), submits form, then tests workflow. | **Medium refactor.** Remove Step 1 login flow entirely! Start test directly at Step 2 (`page.goto('/')`) to test the complete multi-context workflow in Personal Mode. | Medium |

---

## 4. Package Scripts & Command Verification

Analysis of `package.json`:
- `"test": "npm run test:unit && npm run test:e2e"`
- `"test:unit": "jest"`
- `"test:e2e": "playwright test"`
- `"build": "next build"`

All scripts are cleanly defined. Once the UI files and test suites are updated to Personal Mode (`userId: "local"`):
- `npm run test:unit` will execute all updated Jest specs cleanly.
- `npm run test:e2e` will run Playwright against `http://localhost:3000` (or configured base URL) testing instant dashboard access.
- `npm run build` will compile Next.js without session type or route errors.

---

## 5. Concrete Proposed Code Changes for Implementers

### 5.1 Proposed Code: `src/components/Navbar.tsx`
```tsx
"use client";

import React from "react";
import Link from "next/link";
import { ContextSwitcher } from "./ContextSwitcher";

export const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/60 dark:border-zinc-800/60 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 text-lg font-bold tracking-tight group transition-all">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-base shadow-md shadow-indigo-500/20 group-hover:shadow-lg group-hover:shadow-indigo-500/30 transition-all group-hover:scale-105">
              P
            </div>
            <span className="text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Planner
            </span>
          </Link>

          {/* Context Switcher Component */}
          <div className="flex items-center gap-3">
            <ContextSwitcher variant="dropdown" />
          </div>
        </div>

        {/* Right Navigation / Personal Mode Indicator */}
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Personal Mode
          </span>
        </div>
      </div>
    </header>
  );
};
```

### 5.2 Proposed Code: `src/app/page.tsx`
```tsx
"use client";

import React from "react";
import { Navbar } from "@/components/Navbar";
import { ContextSwitcher } from "@/components/ContextSwitcher";
import { TaskList } from "@/components/TaskList";
import { HabitTracker } from "@/components/HabitTracker";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 bg-grid">
      <Navbar />

      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 space-y-8 max-w-5xl mx-auto w-full">
        {/* Header Section */}
        <div className="space-y-4 animate-fade-in-up">
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
              Dashboard
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Manage your tasks across workspace contexts and track your daily
              habit streaks.
            </p>
          </div>

          {/* Context Switcher Pills */}
          <ContextSwitcher variant="pills" />
        </div>

        {/* Workspace Content */}
        <div className="space-y-8">
          {/* Unified To-Do List */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.1s", animationFillMode: "backwards" }}>
            <TaskList />
          </div>

          {/* Habit Tracker */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.2s", animationFillMode: "backwards" }}>
            <HabitTracker />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/60 dark:border-zinc-800/60 py-6 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs text-zinc-400 dark:text-zinc-600">
            <span className="gradient-text font-semibold">Planner</span> &mdash; Centralize your life. Built with Next.js, Prisma & Tailwind CSS.
          </p>
        </div>
      </footer>
    </div>
  );
}
```

### 5.3 Proposed Code: `src/app/login/page.tsx`
```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="w-10 h-10 rounded-full border-3 border-indigo-200 border-t-indigo-600 animate-spin" />
    </div>
  );
}
```

### 5.4 Proposed Code: `src/components/Providers.tsx`
```tsx
"use client";

import React from "react";
import { ContextSwitcherProvider } from "@/context/ContextSwitcherContext";

export interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ContextSwitcherProvider>
      {children}
    </ContextSwitcherProvider>
  );
}
```

---

## 6. Implementation Checklist & Order of Execution

1. **Step 1: UI Component Refactoring (R2)**
   - Update `src/components/Navbar.tsx` (remove `useSession`, `signOut`, sign in/up buttons, dropdown menu).
   - Update `src/app/page.tsx` (remove `useSession`, `HeroSection`, render dashboard directly).
   - Update `src/app/login/page.tsx` (add instant redirect to `/`).
   - Update `src/components/Providers.tsx` (remove `SessionProvider` wrapper).
2. **Step 2: Unit Test Updates (R4 - Jest)**
   - Refactor `tests/jest/tier1/auth.test.ts` to test single-user Personal Mode (`userId: "local"`).
   - Update mock user IDs from `'usr_123'` / `'usr_1'` to `'local'` in `habits.test.ts`, `challenger_streak_tasks.test.ts`, and `cross-feature.test.ts`.
3. **Step 3: E2E Test Updates (R4 - Playwright)**
   - Refactor `tests/e2e/tier1-auth.spec.ts` to verify instant access to dashboard on `/` and `/login` without sign-in forms or sign-out buttons.
   - Update `tests/e2e/tier4-real-world.spec.ts` to bypass `/login` credential submission step and begin directly at dashboard `/`.
4. **Step 4: Verification Execution**
   - Run `npm run build` to verify Next.js build compilation.
   - Run `npm run test:unit` to verify Jest test suite pass rate.
   - Run `npm run test:e2e` to verify Playwright E2E test suite pass rate.

---

## 7. Invalidation & Risk Assessment

- **Risk 1:** If backend API routes (R1) still require session cookies or NextAuth tokens before R1 implementer finishes, client fetch requests to `/api/contexts`, `/api/tasks`, `/api/habits` could fail with 401/403.  
  *Mitigation:* Coordinate with R1 implementer to ensure backend API routes default to `userId: "local"`.
- **Risk 2:** E2E tests failing if Playwright expects `[data-testid="logout-btn"]` or email input fields.  
  *Mitigation:* Update `tier1-auth.spec.ts` and `tier4-real-world.spec.ts` simultaneously with UI changes.

# Implementation Plan — Personal Mode Transition & UX UI Pro Max Redesign

## 1. Overview & Vision
Transform the Planner Next.js application into a single-user **Personal Mode** productivity suite with a **UX UI Pro Max** aesthetic. This update eliminates authentication barriers (`userId: "local"`), lands users directly on an interactive workspace dashboard, and equips the application with dark glassmorphism styling, Framer Motion micro-animations, a responsive Command Center, a dual-view Task Hub (Kanban + List), and a gamified Habit Tracker with 365-day activity heatmaps and streak flame visualizers.

---

## 2. Product Design

### Target Audience & Core Objective
- **Target Audience**: Single-user personal productivity enthusiasts seeking zero friction, instant context switching, and visually rewarding task/habit tracking.
- **Core Objective**: Zero auth friction, instant workspace load at `http://localhost:3000`, fluid animations, and premium visual feedback.

### User Stories
1. **Instant Access**: As a user, I open `http://localhost:3000` and immediately see my workspace dashboard without login buttons or auth redirects.
2. **Context Switching**: As a user, I toggle between "Personal", "Work", and "Freelance" contexts using top nav pills or the glass sidebar, and see the entire app's accent theme and data update instantly.
3. **Dual-View Tasks**: As a user, I can switch between an interactive Drag-and-Drop Kanban board and a keyboard-friendly List view with priority badges, subtasks, tags, and real-time search.
4. **Gamified Habits**: As a user, checking off daily habits triggers streak flame animations, updates my GitHub-style 365-day completion heatmap, and displays celebratory micro-interactions.
5. **Command Palette**: As a user, pressing `Cmd+K` / `Ctrl+K` opens a global command palette to quickly create tasks, habits, or switch contexts.

---

## 3. System Architecture Overview

```
                      +----------------------------------+
                      |        User Browser (UI)         |
                      +----------------------------------+
                                       |
                +----------------------+----------------------+
                |                                             |
   +--------------------------+                 +--------------------------+
   |   Command Center & Nav   |                 |   Context & Dynamic UX   |
   | Glass Sidebar / Cmd+K    |                 |  ContextSwitcherContext  |
   +--------------------------+                 +--------------------------+
                |                                             |
   +-----------------------------------------------------------------------+
   |                       Dashboard Main Layout                           |
   |     +----------------------------+  +---------------------------+     |
   |     | Dual-View Task Subsystem   |  | Gamified Habit Tracker    |     |
   |     | (Kanban DND + List View)   |  | (Streak Flames + Heatmap) |     |
   |     +----------------------------+  +---------------------------+     |
   +-----------------------------------------------------------------------+
                                       |
                               (fetch REST API)
                                       |
   +-----------------------------------------------------------------------+
   |                 Next.js App Router API Route Handlers                 |
   |       /api/contexts    |    /api/tasks    |    /api/habits            |
   |                  (Operate under userId: "local")                       |
   +-----------------------------------------------------------------------+
                                       |
                               (Prisma Client)
                                       |
   +-----------------------------------------------------------------------+
   |                     SQLite / PostgreSQL Database                      |
   |          User (local) | Contexts | Projects | Tasks | Habits          |
   +-----------------------------------------------------------------------+
```

---

## 4. Categorized Feature Deep-Dives

### Feature Subsystem 1: Personal Mode Core & Data Seeding
- **Repository Location**: `src/lib/user.ts`, `prisma/schema.prisma`, `prisma/seed.ts`
- **Description**: Removes NextAuth session checks and 401 unauthorized errors from API endpoints. Establishes a single source of truth helper `getOrCreateLocalUser()` that guarantees the presence of `User` (`id: "local"`, `email: "local@personal.mode"`) and default `Context` (`name: "Personal"`, `color: "#3B82F6"`).
- **API Strategy**: API route handlers (`/api/contexts`, `/api/tasks`, `/api/habits`) invoke `getOrCreateLocalUser()` or reference `LOCAL_USER_ID = "local"` without requiring session headers.

### Feature Subsystem 2: Command Center & UX UI Pro Max Layout
- **Repository Location**: `src/components/Navbar.tsx`, `src/components/Sidebar.tsx`, `src/components/CommandPalette.tsx`, `src/components/QuickAddFAB.tsx`, `src/context/ContextSwitcherContext.tsx`
- **Description**: Modern design system featuring dark glassmorphism (`backdrop-blur-md bg-zinc-900/70 border-zinc-800`), dynamic accent color tokens mapped to active context, collapsible glass sidebar, top navigation bar with dynamic context pills, global `Cmd+K` command palette modal, and a floating quick-add action button (FAB).
- **Framer Motion Integration**: Page transitions, sidebar collapse/expand, modal popovers, button hover scale effects, and accent token transitions powered by Framer Motion (`framer-motion`).

### Feature Subsystem 3: Dual-View Task Management Subsystem
- **Repository Location**: `src/components/TaskList.tsx`, `src/components/KanbanBoard.tsx`, `src/components/TaskListView.tsx`, `src/components/TaskCard.tsx`, `src/app/api/tasks/route.ts`
- **Description**: Interactive task hub supporting fluid view switching between:
  1. **Drag-and-Drop Kanban Board**: Columns for "To Do", "In Progress", and "Done". Card reordering and column movement with Framer Motion layout animations.
  2. **Keyboard-Friendly List/Table View**: Expandable rows, priority badges (High, Medium, Low), subtask progress checklists, tag badges, and real-time text search filter.

### Feature Subsystem 4: Gamified Habit Tracker & Activity Analytics
- **Repository Location**: `src/components/HabitTracker.tsx`, `src/components/HabitHeatmap.tsx`, `src/components/HabitStreakVisualizer.tsx`, `src/app/api/habits/route.ts`
- **Description**: Gamified habit tracking widget including:
  1. **Streak Flame Visualizer**: Animated flame icons reflecting consecutive daily streak count.
  2. **GitHub-Style 365-Day Activity Heatmap Grid**: Visual grid mapping daily habit completions across 52 weeks with color intensity levels.
  3. **Weekly Progress Bar & Celebration FX**: Micro-animations on checking off daily habits.

### Feature Subsystem 5: Automated Verification & Testing Suite
- **Repository Location**: `tests/jest/`, `tests/e2e/`, `package.json`
- **Description**: Comprehensive testing strategy updating Jest unit/integration tests and Playwright E2E tests for single-user Personal Mode (`userId: "local"`). Verifies `npm run build` with 0 compile errors and 100% test pass rate.

---

## 5. Database Design & Models

```prisma
model User {
  id            String    @id
  name          String?
  email         String?   @unique
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  contexts      Context[]
  habits        Habit[]
}

model Context {
  id        String    @id @default(uuid())
  name      String
  color     String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  projects  Project[]
  tasks     Task[]
}

model Task {
  id          String   @id @default(uuid())
  title       String
  description String?
  completed   Boolean  @default(false)
  status      String   @default("TODO") // TODO, IN_PROGRESS, DONE
  priority    String   @default("MEDIUM") // LOW, MEDIUM, HIGH
  tags        String?  // JSON or comma-separated tags
  subtasks    String?  // JSON stringified subtasks
  contextId   String
  context     Context  @relation(fields: [contextId], references: [id], onDelete: Cascade)
}

model Habit {
  id        String     @id @default(uuid())
  name      String
  userId    String
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  logs      HabitLog[]
}

model HabitLog {
  id        String   @id @default(uuid())
  date      String   // YYYY-MM-DD
  completed Boolean  @default(true)
  habitId   String
  habit     Habit    @relation(fields: [habitId], references: [id], onDelete: Cascade)
}
```

---

## 6. Execution & Verification Roadmap

1. **Phase 1: Personal Mode Core & Data Seeding (PM-1)**
   - Implement `src/lib/user.ts` (`getOrCreateLocalUser()`, `LOCAL_USER_ID = "local"`).
   - Create `prisma/seed.ts` for database initialization.

2. **Phase 2: API Route Handler Simplification (PM-2)**
   - Refactor `/api/contexts`, `/api/tasks`, `/api/habits`, `/api/projects` to use `userId: "local"` without 401 session barriers.

3. **Phase 3: Command Center Layout & UX UI Pro Max (PM-3)**
   - Build dark glassmorphic `Navbar.tsx`, `Sidebar.tsx`, `CommandPalette.tsx` (`Cmd+K`), and `QuickAddFAB.tsx`.
   - Update `src/app/page.tsx` and `src/app/login/page.tsx` for instant dashboard access.

4. **Phase 4: Dual-View Task Hub & Gamified Habit Tracker**
   - Implement Kanban Drag-and-Drop board + Table view in `TaskList.tsx`.
   - Implement 365-day GitHub heatmap + streak flames in `HabitTracker.tsx`.

5. **Phase 5: Test Refactoring & Verification (PM-4)**
   - Update Jest test suite in `tests/jest/` and Playwright specs in `tests/e2e/`.
   - Execute `npx tsc --noEmit` (0 errors), `npm run test:unit` (100% pass), `npm run build`.
   - Forensic Integrity Audit & Reviewer verification gate.

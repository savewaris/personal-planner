# Detailed Analysis: Task & Habit Subsystems & Verification (R3 & R4)

**Author**: Explorer 3 (Task & Habit Subsystems & Verification Specialist)  
**Date**: 2026-07-23  
**Target Milestone**: UX UI Pro Max Redesign (Phase M3)  
**Scope**: Prisma schema extensions, Dual-View Task Hub (R3), Gamified Habit Tracker (R4), API enhancements, and Jest/Playwright verification strategy.

---

## 1. Baseline Architecture & Existing Implementation

### 1.1 Existing Prisma Schema (`prisma/schema.prisma`)
- **`Task` Model** (Lines 98–114):
  - Current fields: `id`, `title`, `description`, `completed` (Boolean, default `false`), `createdAt`, `updatedAt`, `contextId`, `projectId`.
  - **Limitations**: Only supports binary `completed` flag. Lacks status states (`TODO`, `IN_PROGRESS`, `DONE`), priority levels (`URGENT`, `HIGH`, `MEDIUM`, `LOW`), tag arrays, and subtask checklists.
- **`Habit` & `HabitLog` Models** (Lines 116–140):
  - Current fields: `Habit` (`id`, `name`, `streak`, `userId`, `createdAt`, `updatedAt`, `logs`), `HabitLog` (`id`, `date`, `completed`, `habitId`).
  - **Limitations**: `streak` stores only current active streak. No storage for `longestStreak`, category, color theme, target frequency, or target days. `HabitLog` lacks a `@@unique([habitId, date])` constraint, allowing potential duplicate day log entries.

### 1.2 Existing UI Components
- **`TaskList.tsx` (`src/components/TaskList.tsx`)**:
  - Single-view vertical list.
  - Basic filter tabs (`All`, `Active`, `Completed`).
  - Simple modal for detail entry (`title`, `description`, `contextId`).
  - Uses `useContextSwitcher` for context filtering.
  - Lacks drag-and-drop Kanban columns, priority badge styling, inline subtask checklists, tag pills, search filter, and keyboard shortcuts.
- **`HabitTracker.tsx` (`src/components/HabitTracker.tsx`)**:
  - Basic vertical checklist.
  - Static orange badge displaying `🔥 {habit.streak} days`.
  - Lacks 365-day contribution heatmap grid, weekly breakdown chart, streak level flame styling, celebratory completion micro-animations, and habit metadata filters.

### 1.3 Existing API Routes
- `src/app/api/tasks/route.ts` & `[id]/route.ts`:
  - `GET /api/tasks?contextId=...`: Fetches tasks ordered by `createdAt: 'desc'`.
  - `POST /api/tasks`: Validates `title` (1-255 chars), `description` (<= 5000 chars), `contextId`.
  - `PATCH /api/tasks/[id]`: Updates `completed`, `title`, `description`, `contextId`, `projectId`.
  - `DELETE /api/tasks/[id]`: Deletes task by ID.
- `src/app/api/habits/route.ts` & `[id]/log/route.ts`:
  - `GET /api/habits`: Fetches habits and calculates active `streak` via `calculateStreak` in `src/lib/streak.ts`.
  - `POST /api/habits`: Creates habit with `name`.
  - `POST /api/habits/[id]/log`: Upserts `HabitLog` for target date, updates habit `streak` in DB.

### 1.4 Existing Test Suites
- **Jest Unit Tests** (`tests/jest/tier1/tasks.test.ts`, `habits.test.ts`, `tier2/boundary.test.ts`):
  - Tests basic CRUD logic, streak calculation rules (today/yesterday active, 3-day gap reset, duplicate log deduplication, leap year boundaries).
- **Playwright E2E Tests** (`tests/e2e/tier1-tasks.spec.ts`, `tier1-habits.spec.ts`):
  - Light DOM visibility and click assertions.

---

## 2. Requirements Analysis for R3: Dual-View Task Hub

### 2.1 Dual View Specifications
1. **Kanban Board View**:
   - **Columns**: `To Do` (`TODO`), `In Progress` (`IN_PROGRESS`), `Done` (`DONE`).
   - **Drag-and-Drop Mechanics**:
     - Drag card across columns to instantly update `status` in UI and via `PATCH /api/tasks/[id]`.
     - Drag overlay with shadow effect, drop indicator highlights, and column counters.
     - Automatic mapping: setting `status: 'DONE'` updates `completed: true`; setting `TODO` or `IN_PROGRESS` sets `completed: false`.
2. **Table / List View**:
   - **Keyboard-Friendly Navigation**: `J`/`K` or Arrow keys to move selection, `Space` to toggle status, `Enter` to open detail drawer/modal.
   - **Priority Badges**: Visual indicator with color codes:
     - `URGENT`: Rose badge (`bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300`).
     - `HIGH`: Amber badge (`bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300`).
     - `MEDIUM`: Blue badge (`bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300`).
     - `LOW`: Zinc/Gray badge (`bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300`).
   - **Inline Subtask Checklist**:
     - Collapsible subtask list per task row/card.
     - Progress bar / count indicator (e.g. `3/5 subtasks`).
     - Inline check/uncheck subtask items without full page reload.
   - **Tag Pills & Search Filter Bar**:
     - Search input with live text filtering across task titles, descriptions, and tag pills.
     - Interactive tag filter pills for fast tag-based slicing.

---

## 3. Requirements Analysis for R4: Gamified Habit Tracker

### 3.1 Visual & Gamification Elements
1. **Streak Flames**:
   - Dynamic flame intensity badges based on streak count:
     - **1–3 days**: Warm Ember (`🔥` - Amber badge)
     - **4–7 days**: Bright Flame (`🔥` - Orange/Red gradient badge with pulse)
     - **8–29 days**: Blazing Fire (`🔥` - Crimson badge with glow)
     - **30+ days**: Supercharged Plasma (`🔥` - Purple/Indigo glowing badge with animated halo)
   - Displays both current streak and all-time `longestStreak`.
2. **365-Day Heatmap Grid**:
   - GitHub-style 52-week x 7-day contribution grid.
   - Cells shaded by completion status / count:
     - Level 0: Empty (`bg-zinc-100 dark:bg-zinc-800`)
     - Level 1: Light Emerald (`bg-emerald-200 dark:bg-emerald-900`)
     - Level 2: Medium Emerald (`bg-emerald-400 dark:bg-emerald-700`)
     - Level 3: Deep Emerald (`bg-emerald-600 dark:bg-emerald-500`)
   - Interactive hover tooltips showing exact date (e.g. `2026-07-23: Completed`).
3. **Weekly Progress Breakdown Chart**:
   - 7-day bar/ring chart (Mon through Sun) summarizing total habit completion rates.
   - Weekly percentage score (e.g., `85% Completion Rate`).
4. **Celebratory Micro-Animations**:
   - Framer Motion animation effects upon checking a habit log:
     - Confetti / spark burst around checkbox.
     - Scale-up spring effect on flame badge.
     - Streak milestone toast notification (e.g., "🎉 7-Day Streak Achieved!").
5. **Habit Metadata**:
   - Category tag (`Health`, `Productivity`, `Mindfulness`, `Fitness`, `Custom`), color picker, target frequency/days.

---

## 4. Prisma Schema Extensions (`prisma/schema.prisma`)

```prisma
// Enum for Task Status
enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
}

// Enum for Task Priority
enum TaskPriority {
  URGENT
  HIGH
  MEDIUM
  LOW
}

// Model Task Updates
model Task {
  id          String       @id @default(uuid())
  title       String
  description String?
  completed   Boolean      @default(false)
  status      TaskStatus   @default(TODO)
  priority    TaskPriority @default(MEDIUM)
  tags        String[]     @default([])
  subtasks    Subtask[]    
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  contextId   String
  context     Context      @relation(fields: [contextId], references: [id], onDelete: Cascade)

  projectId   String?
  project     Project?     @relation(fields: [projectId], references: [id], onDelete: SetNull)

  @@index([contextId])
  @@index([projectId])
  @@index([status])
  @@index([priority])
}

// Model Subtask (relational checklist item)
model Subtask {
  id        String   @id @default(uuid())
  title     String
  completed Boolean  @default(false)
  taskId    String
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([taskId])
}

// Model Habit Updates
model Habit {
  id              String     @id @default(uuid())
  name            String
  category        String?    @default("General")
  color           String?    @default("emerald")
  icon            String?    @default("🔥")
  targetFrequency String     @default("DAILY")
  targetDays      String[]   @default([])
  streak          Int        @default(0)
  longestStreak   Int        @default(0)
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  userId          String
  user            User       @relation(fields: [userId], references: [id], onDelete: Cascade)

  logs            HabitLog[]

  @@index([userId])
}

// Model HabitLog Updates
model HabitLog {
  id        String   @id @default(uuid())
  date      DateTime @default(now())
  completed Boolean  @default(true)

  habitId   String
  habit     Habit    @relation(fields: [habitId], references: [id], onDelete: Cascade)

  @@unique([habitId, date])
  @@index([habitId, date])
}
```

---

## 5. Required API Route Enhancements

### 5.1 Task Routes
- **`GET /api/tasks`**:
  - Accept query params: `contextId`, `status`, `priority`, `search`, `tag`.
  - Include relational `subtasks` sorted by `createdAt: 'asc'`.
- **`POST /api/tasks`**:
  - Accept `status`, `priority`, `tags`, `subtasks` array (`[{ title: string }]`).
- **`PATCH /api/tasks/[id]`**:
  - Accept updates to `status`, `priority`, `tags`, `completed`.
  - When `status === 'DONE'`, automatically set `completed = true`. When `status === 'TODO'` or `'IN_PROGRESS'`, set `completed = false`.
- **`POST /api/tasks/[id]/subtasks`** & **`PATCH /api/subtasks/[id]`**:
  - Dedicated route handlers for adding subtasks and toggling subtask completion.

### 5.2 Habit Routes
- **`GET /api/habits`**:
  - Accept date range query params (`?startDate=...&endDate=...`) for fetching 365-day heatmap data efficiently.
  - Return calculated `streak`, `longestStreak`, and full 365-day log history map.
- **`POST /api/habits/[id]/log`**:
  - Upsert log entry for target date.
  - Recalculate `streak` and update `longestStreak = Math.max(longestStreak, currentStreak)`.

---

## 6. Verification & Testing Plan (Jest & Playwright)

### 6.1 Jest Unit & Route Handler Tests (`tests/jest/`)
- **`tests/jest/tier1/tasks.test.ts`**:
  - Verify status transition logic (`TODO` -> `IN_PROGRESS` -> `DONE`).
  - Verify priority filtering and tag filtering.
  - Verify subtask toggle and completion ratio calculation.
- **`tests/jest/tier1/habits.test.ts`**:
  - Verify 365-day log history formatting for heatmap grid.
  - Verify `longestStreak` tracking across streak resets.
  - Verify weekly breakdown percentage aggregations.

### 6.2 Playwright E2E Tests (`tests/e2e/`)
- **`tests/e2e/tier3-kanban.spec.ts`**:
  - Toggle between Kanban and Table view buttons.
  - Perform drag-and-drop on task card from `To Do` column to `In Progress` column.
  - Filter tasks using live search input and tag pill filters.
- **`tests/e2e/tier4-habits-gamified.spec.ts`**:
  - Click habit checkbox and assert celebratory Framer Motion canvas/particle animation element.
  - Hover over 365-day heatmap grid cell and assert tooltip visibility.
  - Verify flame counter badge classes based on streak thresholds.

---

## Summary of Handoff Recommendations
1. Implement Prisma migration for `TaskStatus`, `TaskPriority`, `Subtask` model, and `Habit` metadata fields.
2. Refactor `TaskList.tsx` into `TaskHub.tsx` supporting Kanban Board and Table view switcher using Framer Motion layout transitions.
3. Refactor `HabitTracker.tsx` into `GamifiedHabitTracker.tsx` incorporating 365-day Heatmap, Weekly Breakdown, Flame level indicators, and Framer Motion micro-animations.
4. Add comprehensive Jest and Playwright test cases covering status transitions, subtasks, heatmaps, and E2E interactions.

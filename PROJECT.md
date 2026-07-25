# Project: Life Planner Next.js Application — UX UI Pro Max Redesign

## Architecture
- Tech Stack: Next.js 16 (App Router), React 19, Tailwind CSS v4, Prisma ORM (SQLite/PostgreSQL), Framer Motion, `@hello-pangea/dnd`, `canvas-confetti`.
- Personal Mode Integration: Operates under single-user default profile (`userId: "local"`), bypassing NextAuth barriers while storing data in Prisma.
- Design System: Dark glassmorphic card surfaces (`glass-card-interactive`, `glass-panel`), Google Fonts (`Outfit` + `Inter`), dynamic CSS theme color tokens (`--accent-color`, `--accent-rgb`, `--accent-glow`) shifting fluidly across contexts.
- Command Center Navigation: Responsive collapsible glass sidebar (`Sidebar.tsx`), sticky top navigation bar (`Navbar.tsx`), global `Cmd+K` / `Ctrl+K` command palette modal (`CommandPaletteModal.tsx`), floating speed-dial button (`QuickAddFab.tsx`).
- Dual-View Task Hub: Seamless toggle between interactive Drag-and-Drop Kanban Board (To Do, In Progress, Done) and keyboard-friendly Table/List view. Supports priority badges (Low, Medium, High, Urgent), subtask checklists, tag pills, search filter.
- Gamified Habit Tracker & Analytics: Interactive Habit Tracker with streak flame visualizers (`🔥 {streak}`), GitHub-style 365-day completion activity heatmap grid, weekly analytics bar charts, and celebratory micro-animations (`canvas-confetti`).

## Code Layout
- `prisma/schema.prisma`: Prisma database schema models (User, Context, Project, Task, Habit, HabitLog)
- `src/app/globals.css`: Tailwind CSS v4 theme configuration, RGB variables, glass utilities
- `src/app/layout.tsx`: Root layout with Google Fonts (`Outfit` & `Inter`) and global providers
- `src/app/page.tsx`: Command Center workspace dashboard layout
- `src/context/ContextSwitcherContext.tsx`: Global React Context for active workspace context & theme switching
- `src/components/ui/motion.tsx`: Reusable Framer Motion animation wrappers (`MotionCard`, `MotionButton`, `PageTransition`, `MotionList`)
- `src/components/Sidebar.tsx`: Collapsible glass sidebar (64px / 240px & mobile drawer)
- `src/components/Navbar.tsx`: Sticky top navigation bar with dynamic context switcher pills and search input
- `src/components/CommandPaletteModal.tsx`: Global `Cmd+K` keyboard-driven palette modal
- `src/components/QuickAddFab.tsx`: Floating action button with speed-dial quick creation popup
- `src/components/TaskHub.tsx`: Master Task Hub container managing view toggle & search
- `src/components/KanbanBoard.tsx` & `KanbanColumn.tsx` & `TaskCard.tsx`: Drag-and-drop Kanban board
- `src/components/TaskListView.tsx`: Keyboard-friendly table/list view with subtasks & tags
- `src/components/HabitTrackerPro.tsx`: Gamified habit tracker container
- `src/components/HabitHeatmap.tsx`: 365-day activity completion heatmap grid
- `src/components/HabitWeeklyChart.tsx`: Weekly progress breakdown chart
- `src/app/api/contexts/`: Context API endpoints
- `src/app/api/tasks/`: Task API endpoints (Kanban, List, subtasks, priority, tags)
- `src/app/api/habits/`: Habit & HabitLog API endpoints (streak, 365-day logs)
- `tests/jest/`: Jest unit test suite
- `tests/e2e/`: Playwright end-to-end test suite

## Interface Contracts

### Local User & Data Seeding ↔ API Routes
- Default User ID: `"local"`
- Default Context Name: `"Personal"`
- All route handlers operate under `userId: "local"` without requiring auth session headers or 401s.

### Context Switcher ↔ App State & Aesthetics
- Active Context: `{ id: string, name: string, color: string }` or `null` ("All Contexts").
- Dynamic Theme: `applyTheme(color)` sets `data-theme="<color>"` on `<html>`, dynamically shifting `--accent-color`, `--accent-rgb`, `--accent-glow`.

### Task Hub ↔ Tasks API
- `GET /api/tasks?contextId={id}&search={q}&tag={tag}`: Fetches array of tasks matching filters.
- `POST /api/tasks`: `{ title, description, contextId, priority, tags, subtasks }`
- `PATCH /api/tasks/[id]`: `{ status, completed, title, priority, tags, subtasks }`
- `DELETE /api/tasks/[id]`

### Habit Tracker ↔ Habits API
- `GET /api/habits`: Returns habits with calculated streaks and 365-day log history.
- `POST /api/habits/[id]/log`: Logs completion for date, updates streak, triggers celebration animation.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Design System & UX UI Pro Max Aesthetics | Packages (`framer-motion`, `lucide-react`, `clsx`, `tailwind-merge`, `canvas-confetti`, `@hello-pangea/dnd`), `globals.css` dynamic tokens, font pairing, motion wrappers | none | IN_PROGRESS |
| M2 | Command Center Navigation & Workspace Switcher | `Sidebar.tsx`, `Navbar.tsx`, `CommandPaletteModal.tsx`, `QuickAddFab.tsx`, layout state wiring | M1 | IN_PROGRESS |
| M3 | Dual-View Task Hub (Kanban + List) | `TaskHub.tsx`, Kanban drag-and-drop board, Table/List view, priority badges, subtasks, tags, search | M1, M2 | IN_PROGRESS |
| M4 | Gamified Habit Tracker & Activity Analytics | `HabitTrackerPro.tsx`, streak flames, 365-day heatmap grid, weekly charts, celebration micro-animations | M1 | PLANNED |
| M5 | Automated Verification & E2E Testing Track | Full Playwright E2E suite, Jest unit tests, `npm run build` compilation (0 errors), Forensic Integrity Audit | M1, M2, M3, M4 | PLANNED |

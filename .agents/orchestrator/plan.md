# Execution Plan: Personal Mode Transition & UX UI Pro Max Redesign

## Overview
Combine Personal Mode Transition (`userId: "local"`, direct dashboard access, simplified API route handlers) with a premium UX UI Pro Max redesign for the Life Planner Next.js application.

## Integrated Milestones

### Milestone 1: Personal Mode Backend & API Simplification (In-Progress)
- **Goal**: Complete auth bypass, auto-seeding helper `getOrCreateLocalUser()` for `userId: "local"` & default "Personal" context, and simplify API routes (`/api/contexts`, `/api/tasks`, `/api/habits`).
- **Subagent**: `worker_pm_1` (`1984477f-923a-41b0-9f51-401addc01d0c`) — currently executing.

### Milestone 2: UX UI Pro Max Design System & Aesthetics
- **Goal**: Establish dark glassmorphism design system with Tailwind CSS, Framer Motion physics-based micro-interactions, dynamic CSS accent color tokens per context, and sleek typography.
- **Key Deliverables**:
  - Global glassmorphism CSS utilities, theme token variables, and layout shell.
  - Integration of `framer-motion` for transitions, modals, and tab switches.

### Milestone 3: Command Center Navigation & Workspace Switcher
- **Goal**: Build responsive Command Center layout:
  - Collapsible glass sidebar with workspace shortcuts & navigation links.
  - Top navigation bar with active context switcher pills & Personal Mode indicator.
  - `Cmd+K` / `Ctrl+K` Command Palette modal with instant search & navigation actions.
  - Floating Quick-Add Action Button (FAB).

### Milestone 4: Dual-View Task Management Hub (Kanban + List)
- **Goal**: Build interactive dual-view Task Hub:
  - Interactive Drag-and-Drop Kanban Board (To Do, In Progress, Done) with Framer Motion drag animations.
  - Keyboard-friendly List/Table View with priority badges, inline subtask checklists, tags, and real-time search filtering.
  - Full synchronization with `/api/tasks` endpoint.

### Milestone 5: Gamified Habit Tracker & Activity Analytics
- **Goal**: Build interactive gamified Habit Tracker:
  - Animated streak flame visualizers & consecutive day calculations.
  - GitHub-style 365-day activity heatmap grid & weekly completion charts.
  - Celebratory micro-animations on habit completion.
  - Full synchronization with `/api/habits` and `/api/habits/[id]/log` endpoints.

### Milestone 6: Comprehensive Verification & Audit
- **Goal**: Verify combined requirements:
  - Pass `npm run build` with 0 compilation/TypeScript errors.
  - Update and pass 100% of Jest unit tests and Playwright E2E test specs.
  - Verification pipeline: Reviewer approval, Challenger stress test, Forensic Auditor (CLEAN verdict).

## Acceptance Criteria Checklist
- [ ] Direct access to dashboard at `/` under `userId: "local"` without auth barriers.
- [ ] Responsive Command Center layout (glass sidebar, top nav context switcher, Cmd+K palette, FAB).
- [ ] Framer Motion physics micro-interactions and dynamic context CSS theme tokens.
- [ ] Dual-view Task Hub (Kanban drag-and-drop + List view with subtasks, priority, tags, search).
- [ ] Gamified Habit Tracker with streak flames, 365-day heatmap grid, and celebration animations.
- [ ] `npm run build` passes with 0 compilation errors.
- [ ] All Jest and Playwright tests pass 100%.
- [ ] Forensic Auditor verdict is CLEAN.

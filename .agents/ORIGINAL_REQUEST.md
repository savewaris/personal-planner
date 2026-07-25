# Original User Request

## 2026-07-22T20:34:10Z

<USER_REQUEST>
# Teamwork Project Prompt — Personal Mode Transition

A data-driven Next.js personal productivity application designed for single-user use. Eliminates authentication barriers so the user can immediately access workspace Contexts, Project Hubs, the Unified To-Do List, and Habit Tracker.

Working directory: `d:/save/Antigravity/Planner`
Integrity mode: development

## Requirements

### R1. Personal Mode (No Auth Barrier)
Bypass NextAuth login forms and session checks. Direct all dashboard views and API endpoints to operate under a default local user profile (`userId: "local"`). Auto-seed the "local" user and default "Personal" context if missing.

### R2. Instant Access Navbar & Dashboard
Update the Navbar and main page so the user lands directly on their workspace dashboard with full access to Context Switcher, Task List, and Habit Tracker without login buttons or sign-in prompts.

### R3. API & Database Simplification
Simplify route handlers (`/api/contexts`, `/api/tasks`, `/api/habits`) to automatically reference the local user account without requiring session authentication headers or 401 unauthorized checks.

### R4. Automated Verification
Ensure `npm run build` passes with 0 compile errors, unit tests updated for single-user personal mode pass 100%, and visual UI inspection confirms a clean, friction-free dashboard.

## Acceptance Criteria

### Personal Mode UI
- [ ] Navigating to `http://localhost:3000` directly loads the full dashboard and task manager.
- [ ] No login forms, sign-in buttons, or auth redirects block application usage.

### Data & API Operations
- [ ] Creating/updating/deleting Contexts, Tasks, and Habits succeeds seamlessly under the default local user context.
- [ ] Habit daily completion logs and streak calculations function without session errors.

### Verification
- [ ] `npm run build` succeeds cleanly.
- [ ] Unit tests updated for single-user mode pass 100%.
</USER_REQUEST>

## 2026-07-22T20:38:42Z

<USER_REQUEST>
Redesign and build a premium, state-of-the-art UI/UX ("UX UI Pro Max") for the contextual Life Planner Next.js application, featuring dynamic workspace context switching, Framer Motion micro-animations, a dual-view Task Management hub (Kanban + List), and a gamified Habit Tracker with streak visualizers and heatmaps.

Working directory: d:/save/Antigravity/Planner
Integrity mode: development

## Requirements

### R1. Design System & UX UI Pro Max Aesthetics
Implement a modern design system featuring dark glassmorphism, glowing glass card surfaces, sleek typography (Inter/Outfit), fluid Framer Motion micro-interactions, and context-tailored dynamic accent color tokens (e.g. Work, Personal, Freelance).

### R2. Command Center Navigation & Workspace Switcher
Build a responsive Command Center layout comprising a collapsible glass sidebar, a top navigation bar with dynamic context switcher pills, a `Cmd+K` / `Ctrl+K` command palette modal, and a floating quick-add action button.

### R3. Dual-View Task Management Subsystem
Implement a dual-view task hub allowing seamless toggling between an interactive Drag-and-Drop Kanban Board (To Do, In Progress, Done) and a keyboard-friendly Table/List View, equipped with priority badges, inline subtask checklists, tag filters, and real-time text search.

### R4. Gamified Habit Tracker & Activity Analytics
Develop an interactive Habit Tracker with streak flame visualizers, a GitHub-style 365-day completion activity heatmap grid, weekly completion progress charts, and celebratory completion micro-animations.

## Acceptance Criteria

### UI/UX & Design Quality
- [ ] Uses Framer Motion for all tab switches, modal popovers, board column drag-and-drop, and card state transitions.
- [ ] Dynamic CSS color tokens update fluidly across the application when changing active Context.
- [ ] Fully responsive on mobile, tablet, and desktop viewports with accessible ARIA semantics and high-contrast dark theme colors.

### Code & Technical Standards
- [ ] Zero TypeScript compilation errors (`npm run build` passes cleanly).
- [ ] Full integration with existing Prisma models (`User`, `Context`, `Project`, `Task`, `Habit`, `HabitLog`) and API routes under Personal Mode (`userId: "local"`).
- [ ] Automated verification via Playwright E2E and Jest test suites passing 100%.
</USER_REQUEST>

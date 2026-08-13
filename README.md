# Personal Planner & To-Do Application

Ultra-fast personal planner with chat-style task creation, kanban boards, habit tracking, SOP knowledge library, and cross-device sync.

---

## 📁 Project File Structure & Architecture Map

```text
personal-planner/
├── 📚 docs/                        # Centralized Project Documentation
│   ├── architecture/
│   │   ├── PROJECT.md              # Core project requirements & scope
│   │   ├── project_concept.md      # Product vision & conceptual architecture
│   │   └── ORIGINAL_REQUEST.md     # Initial requirements transcript
│   ├── design/
│   │   └── DESIGN_SYSTEM.md        # Tokens, theme palette & design guidelines
│   ├── planning/
│   │   └── implementation_plan.md  # Step-by-step dev roadmap
│   └── testing/
│       ├── TEST_INFRA.md           # Testing framework setup & runner scripts
│       └── TEST_READY.md           # Test readiness report
│
├── 🎨 src/
│   ├── app/                        # Next.js App Router Pages & API Routes
│   │   ├── api/                    # REST API endpoints (tasks, habits, notes, contexts)
│   │   ├── calendar/               # Calendar View Page
│   │   ├── habits/                 # Habit Tracker Page
│   │   ├── projects/               # Projects & Kanban Board Page
│   │   ├── settings/               # App Settings Page
│   │   └── tasks/                  # Task Management Page
│   │
│   ├── components/                 # Modular Component Architecture
│   │   ├── tasks/                  # 📋 Task domain components (TaskCard, Kanban, etc.)
│   │   ├── habits/                 # 🔥 Habit domain components (HabitTracker, Heatmap)
│   │   ├── calendar/               # 📅 Calendar domain components
│   │   ├── notes/                  # 📝 Quick notes & SOP Knowledge Library
│   │   ├── layout/                 # 🖼️ Navigation, Sidebar, Providers & CommandPalette
│   │   └── ui/                     # 🧩 Generic Reusable UI Primitives
│   │       ├── modals/             # Context & Confirm Modals
│   │       ├── inputs/             # Notion Tag Selector
│   │       ├── badges/             # Context & Color Badges
│   │       └── buttons/            # Floating Action Buttons
│   │
│   ├── types/                      # 🏷️ Centralized Pure Domain TypeScript Interfaces
│   │   ├── task.ts                 # TaskItem & TaskStatus
│   │   ├── habit.ts                # HabitItem & HabitLog
│   │   ├── context.ts              # WorkspaceContextItem
│   │   ├── project.ts              # ProjectItem & ProjectRequirement
│   │   ├── notes.ts                # NoteItem & SopItem
│   │   ├── routine.ts              # RoutineItem
│   │   └── index.ts                # Barrel export (@/types)
│   │
│   ├── hooks/                      # ⚓ Reusable Custom React Hooks
│   │   ├── useKeyboardShortcut.ts  # Cmd+K / Ctrl+K listener
│   │   ├── useToast.ts             # Auto-dismissing toast notifications
│   │   ├── useMounted.ts           # SSR safety hydration check
│   │   └── index.ts                # Barrel export (@/hooks)
│   │
│   ├── lib/                        # 🛠️ Server & Utility Infrastructure
│   │   ├── db/                     # Prisma client & server store (db-store.ts, prisma.ts)
│   │   ├── auth/                   # NextAuth configuration & user helpers (auth.ts, user.ts)
│   │   ├── theme/                  # Design tokens & color theme palettes (colors.ts, tokens.ts)
│   │   ├── utils/                  # API response wrappers & streak calculators
│   │   └── index.ts                # Barrel export (@/lib)
│   │
│   ├── context/                    # Planner Global React Context & Store
│   └── services/                   # Typed API Client Service
│
└── 🧪 tests/                       # Jest & Playwright Test Suites
    ├── e2e/                        # Playwright End-to-End Tests (Tiers 1-4)
    └── jest/                       # Jest Unit & Integration Tests (Tiers 1-3)
```

---

## 🚀 Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🧪 Running Tests

```bash
# Run unit & integration tests
npm run test:unit

# Run end-to-end Playwright tests
npm run test:e2e
```

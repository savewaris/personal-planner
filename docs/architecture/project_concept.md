# Project Concept
A data-driven web application designed to eliminate "platform fragmentation" by centralizing your life into distinct, isolated environments (e.g., Full-Time Job, Freelance, Side Projects).

## Core Features
*   **Context Switcher**: Visually toggles the entire app's data and theme to show only the active area of your life.
*   **Project Hubs**: Individual projects under a Context that hold descriptions, requirements, and embedded links to external tools (Jira, Figma, etc.).
*   **Unified To-Do List**: A master task list that aggregates tasks across all contexts, with filtering based on the active workspace.
*   **Habit Tracker**: A simple, globally visible daily checklist with streak tracking.

## Tech Stack (T3-Inspired)
*   **Platform**: Next.js Web App (scalable to PWA, mobile via React Native, or desktop via Tauri).
*   **Frontend**: React, Tailwind CSS (for rapid context-based theming).
*   **Backend & API**: Next.js Route Handlers.
*   **Database**: Prisma ORM.
*   **Authentication**: NextAuth.js.

## Database Architecture
A highly scalable, normalized relational schema optimized with UUIDs, indexing, and timestamps:

*   **USER** (Manages Auth & Profile)
*   **CONTEXT** (e.g., "Freelance")
*   **PROJECT** (Belongs to a Context)
*   **TASK** (Belongs to a Project, or directly to a Context as an "orphan/inbox" task)
*   **HABIT & HABIT_LOG** (Independent of contexts; tracks daily completions by timezone)

## Next Steps
*   Run `npx create-next-app` to scaffold the project (or use the developer-suite-scaffolder MCP tool).
*   Initialize the Prisma database schema.

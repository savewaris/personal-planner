# Areas, Focus Board and Manual-First Planning — Design

Status: draft for user review (no code written)
Date: 2026-10-16
Path: architectural (new concept level, board restructure, schema change)

## 1. Intent (agreed with the user)

The user finds tags, projects, workspaces and six Kanban group-by modes confusing. They want:

- One calm board showing work by when and how far along it is (Today, In Progress, ...), not split per project.
- Projects with tasks inside them, plus ongoing areas with no end (job hunting, learning Japanese, soft skills) and loose standalone tasks.
- To organize things themselves. AI help is welcome but must not be required.

Decisions made in the brainstorm:

| # | Decision |
|---|----------|
| 1 | Add a separate **Area** level above Project. Area replaces Workspace/Context. |
| 2 | One **Focus board**: Today / In Progress / Up Next / Someday / Done. Area and project appear as chips and filters, not columns. |
| 3 | Ongoing areas use a **next-action task** plus **recurring tasks**. |
| 4 | **Manual first.** Version 1 has no AI capture box. It has a quick-add bar with shortcuts and one AI "break this down" button (Level 1). |
| 5 | Capture box (propose-then-approve), AI-suggested migration, MCP/agent and phone capture are **later phases**, out of scope here. |
| 6 | **Projects are their own top-level section**, separate from Areas. A project may link to one Area or stand alone (for example "E-commerce platform" has no area). It is not nested under an Area in navigation. |

## 2. Concepts: one job each

- **Area**: an ongoing responsibility with no finish line (Japanese, Job Hunt, Soft Skills).
- **Project**: a finite outcome with an end. It has its own place in navigation. It may link to at most one Area ("Portfolio site" links to Job Hunt) or stand alone ("E-commerce platform"). The link is for grouping and chips only; it never changes where the project appears in the sidebar.
- **Task**: has exactly one home: a project, an area directly, or neither (standalone).
- **Tag**: optional context only (energy, person, place). A tag name may not equal an Area name.
- **Status**: board column state only. It is never a container.

Effective area of a task = `task.areaId ?? task.project?.areaId ?? null`. The Workspace/Context concept is retired.

Chip rule on cards: a task in a project shows the project name (and the project's area as a smaller hint where space allows); a task directly in an area shows the area; a loose task shows "No area". Counts: an area's count covers only its own tasks, not its projects' tasks; a project's count is its open tasks.

Source basis: PARA, GTD and Things 3 separate Areas from Projects this way. The tag-duplication rule and the exact column set are this design's own choices, not sourced practice.

## 3. Data model (Prisma, additive first)

```
Area    { id, userId, name, purpose?, color?, sortOrder, archivedAt? }
Project { ...existing, areaId? -> Area (SetNull, optional: null = standalone),
          status ACTIVE|ON_HOLD|DONE, targetDate? }
Task    { ...existing,
          status  INBOX|TODAY|IN_PROGRESS|UP_NEXT|SOMEDAY|DONE,
          areaId? -> Area (SetNull), sortOrder, doneAt?,
          recurrenceRule?, isAreaNextAction Boolean @default(false) }
Tag     { id, userId, name }          TaskTag { taskId, tagId }
```

Rules:
- A task may not have both `projectId` and `areaId` set to conflicting areas; if `projectId` is set, `areaId` must be null (the project supplies it). Enforce in the service layer and a DB CHECK.
- `contextId` on Task becomes optional during migration, then is removed in the final step.
- Existing `status` values TODO and IN_PROGRESS map to UP_NEXT and IN_PROGRESS; DONE stays DONE. Tasks due today or overdue map to TODAY.
- JSON `tags` strings migrate to Tag rows; any name equal to an Area name is flagged in the migration screen, not silently dropped.
- Index (userId, status, sortOrder), (areaId), (projectId).

## 4. Focus board

- One query: all non-Done tasks, plus Done from the last 7 days, filtered by chosen area, project and tag chips.
- Columns: Today, In Progress, Up Next, Someday, Done.
- Dragging changes only `status` and `sortOrder`.
- Card shows project chip, else area chip, plus due date and tags.
- Soft warnings, never blocks: Today over about 5 cards, In Progress over 3.
- The six group-by modes and the Select Columns filter in `KanbanBoard.tsx` are removed.
- Area pages show the next-action card, recurring tasks, linked projects (reference only) and a mini board of the area's own tasks.
- Project pages show the project's tasks grouped by status with a progress bar.
- Deleting or archiving an Area never deletes its linked projects; they become standalone (`SetNull`).

### 4a. Screens

Clickable mockups (private to the user): https://claude.ai/artifact/BSJ1tc2t3AfquWQS1vWZs9. Boards are linked like a prototype: sidebar, card chips, buttons and dialogs all navigate.

| Screen | Role |
|--------|------|
| Home (first page after login) | Date header, a large Today panel with a Start button per card, In Progress and Up Next beside it, narrow Someday and Done lists. Quick-add in the header. Column headings open the Focus board. |
| Focus board | Sidebar plus the five columns, tag filter chips and quick-add. Selecting an area or project in the sidebar filters the board. |
| Area page (one per area) | Header with colour dot, name and one-line purpose; buttons + Project, + Task, Edit. Next-action card with Start, open and done-this-week counts, Recurring list, Linked projects (progress bars) and a mini board of the area's own tasks. |
| Projects page | Cards for every project with area chip or "Standalone", progress, target date; filters All / Linked to an area / Standalone; empty On hold and Done sections. |
| Project page | Breadcrumb "Projects / name", status badge, target date, area chip (or "Standalone, no area"), + Task, "Mark project done" (disabled until every task is done), progress bar, tasks grouped In Progress / Up Next / Done with 44 px toggles, Details panel (Area incl. "None (standalone)", Status, Target date, Notes). |
| New project dialog | Name, optional Area (default "None, standalone"), optional target date, optional first tasks one per line; callout "Never finishes? That is an area" linking to New area. |
| New area dialog | Name, optional one-line purpose, six colour swatches, optional first next action; callout "Something with an end? That is a project" linking to New project. |
| Phone | Status tabs (Today, Doing, Next, Later, Done) with counts, area filter chips, large Move and Done buttons per card, quick-add fixed at the bottom. Touch targets at least 44 px. |

Sidebar (identical on every desktop screen):
- Home, Focus board (count)
- **Areas**: flat list with round colour dots and counts, then "No area" for loose tasks
- **Projects** (heading links to the Projects page): square markers, area colour when linked, hollow marker when standalone
- "+ Area" and "+ Project" buttons

Not designed yet (build with the same patterns, review before shipping): the "No area" page, the Edit area form (reuse the New area dialog), phone versions of the area, project and Projects screens. Task detail view is also undesigned.

Not chosen earlier: plain columns and area swimlanes. Swimlanes can return later as an optional "by area" view.

Implications:
- Home and Focus board share the same task query and card component; Home only changes the layout and shows Today first.
- The nav gets Home and Focus board; Areas and Projects live in the sidebar.
- On narrow screens the Focus board collapses to the phone layout and the sidebar becomes a drawer.
- The mockups use a placeholder look (IBM Plex Sans, neutral greys, area colours). The real build must use the app's existing design tokens, not these colours.
- Mockup numbers (sidebar counts) are placeholders and do not reconcile.

## 5. Ongoing areas

- Each Area can hold one task flagged `isAreaNextAction`; the Area page warns when it has none.
- Recurring tasks ("Japanese 30 min", weekly) store `recurrenceRule`. Completing one marks it Done and creates the next occurrence in Up Next, so Done does not fill with copies. Recurrence behaviour in other apps was not verified, so keep the rule format simple (daily, weekly on chosen days) and test it.

## 6. Quick-add bar (no AI)

- Single text input available on every page.
- Syntax: `#Area` or `#Project` picks the home, `@tag` adds a tag, a date phrase ("tomorrow", "fri") sets the due date, `!today` or `!someday` sets status.
- Parsing is deterministic code (chrono-node for dates, name matching against existing areas and projects). Unmatched `#name` shows a "create new area?" prompt; nothing is created silently.
- Default status is Up Next, or Today when the due date is today.

## 7. AI in version 1: "Break this down" button (Level 1)

- Appears on a project or on any task card.
- One AI call returns a flat list of suggested subtask titles; the user ticks the ones to add. Nothing is saved until Add is pressed.
- Cap 8 suggestions. Reuses the existing multi-provider free-model cascade in the app (Gemini, Groq, Cerebras, OpenRouter) via the existing "Let AI Cook" plumbing; read that code before changing it.
- Output is validated with Zod; on failure show a plain error and keep the user's work.
- Use the current AI SDK structured-output API (`generateText` with `Output.object`), not the deprecated `generateObject`. Confirm Zod 4 compatibility with the installed `ai` package first.

## 8. Migration (manual)

A one-time screen, shown after the schema ships:
- Lists each old Workspace with a dropdown: make it an Area, merge into an existing Area, or drop.
- Lists each old Project: link to an Area, leave standalone, or promote to an Area.
- Lists JSON tags: keep as Tag, convert to Area, or drop.
- Dry-run preview of counts before applying; apply in one transaction; keep a backup export.

## 9. Build order

1. Schema (additive), Area CRUD, Area pages.
2. Focus board replacing group-by modes.
3. Quick-add bar.
4. Migration screen, then remove Context and the old board code.
5. "Break this down" button.

Each step ships on its own and leaves the app working.

## 10. Out of scope (later phases)

- Propose-then-approve capture box and its draft table.
- AI-suggested migration.
- MCP route, OAuth, Telegram or iOS capture, agent behaviour.
- Weekly review of Someday items, habit streak redesign, notes/routine changes.

## 11. Testing

- Jest: quick-add parser, status mapping, effective-area rule, recurrence next-occurrence, migration mapping.
- Playwright: drag between columns, filter chips, quick-add flow, migration dry-run, creating a standalone project and a linked project, deleting an area leaves its projects standalone.
- Accessibility: the existing axe test must pass against this app. Note the test reuses whatever serves port 3000; run it with the planner's own server.

## 12. Known risks and unverified points

- Next.js 16 here has breaking changes; read the relevant guide in `node_modules/next/dist/docs/` before writing code.
- Prisma 7 migration on the Neon database: take a backup before running.
- Free-model output quality for "break this down" is untested.
- Moving existing users' tasks to new statuses is a lossy guess for tasks with no due date; the migration screen must show them.

## 13. Open questions for the user

- Should "Mark project done" be blocked until all tasks are done (as in the mockup) or allowed with a warning?

- Should Done keep 7 days visible, or a different window?
- Are the WIP numbers (Today about 5, In Progress 3) right for you?
- Should Someday items appear in any weekly review, or stay hidden until opened?

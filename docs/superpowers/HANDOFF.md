# Handoff: Areas + Focus board redesign

Written 2026-10-17. Read this first in a new session.

## Where we are
Brainstorm and design are done. The spec is written and waits for the user's review. No product code has been written.

## Files
- Spec (not committed): `docs/superpowers/specs/2026-10-16-areas-focus-board-design.md`
- Research report: `docs/superpowers/research/AI planner structure and capture.md`
- Clickable design mockups (private): https://claude.ai/artifact/BSJ1tc2t3AfquWQS1vWZs9
  Read it with the Artifact tool, action `read`. Its source files live under `project/`.
- Memory note: `planner-areas-focus-board-redesign` in the Agent Memory folder.

## Decisions already made (do not re-ask)
1. Area (ongoing, no end) replaces Workspace/Context.
2. Projects are a separate top-level section. A project links to one area or stands alone.
3. One Focus board: Today / In Progress / Up Next / Someday / Done. Area and project are chips and filters.
4. Ongoing areas use one next-action task plus recurring tasks.
5. Manual first. Version 1 has a quick-add bar (`#area @tag date`) and one AI "break this down" button. Capture box, AI migration, MCP and phone capture come later.
6. Migration is a manual screen with a dry run and a backup.

## Next actions, in order
1. Ask the user to review the spec; apply their changes.
2. Answer the open questions in spec section 13 (Done window, WIP numbers, Someday in weekly review, "Mark project done" rule).
3. Commit the spec and research (end the message with the Co-Authored-By line).
4. Invoke `superpowers:writing-plans` to write the implementation plan. User reviews the plan and picks how to run it.
5. Optional first: design the missing screens (No area page, Edit area form, phone area/project/Projects, task detail).

## Before any code
- Read the relevant guides in `node_modules/next/dist/docs/` (AGENTS.md says this Next.js has breaking changes).
- Back up the Neon database before migrating.
- Check Zod 4 and AI SDK compatibility before the AI button.

## Known problem: Stop hook
The Stop hook runs Playwright accessibility tests against port 3000. Another project's dev server holds that port, so the tests scan the wrong site and fail. Stop that server, or run the planner on another port and set `PLAYWRIGHT_TEST_BASE_URL`. I made no planner code changes, so these failures are unrelated to this work.

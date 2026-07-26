# Mandatory Quality Verification & Mistake Prevention Rules

NEVER declare a task finished, resolved, or working without executing the comprehensive 4-point verification loop:

## Core Mistake Prevention Guardrails (DO NOT REPEAT MISTAKES):
1. **Unique React Keys**: When rendering arrays of grid cells or items (e.g. calendar dates), NEVER use raw date strings alone as keys. ALWAYS append index: `key={`${dateStr}-${index}`}`.
2. **Dashed Border Radius Bleed**: When styling containers with `border-dashed` and `rounded-*`, ALWAYS include `overflow-hidden` to prevent corner dashed border bleeding.
3. **No Redundant Floating Action Buttons**: If section headers already contain direct `+ New Task` / `+ Add Habit` buttons, DO NOT overlay floating `+` FAB buttons on the page.
4. **Timezone-Safe Date Formatting**: NEVER use `.toISOString().split("T")[0]` for local calendar month grid generation (timezone offsets shift midnight dates). Use local year, month, date string formatters.
5. **Cross-Device Deletion Sync**: NEVER rely on `localStorage` alone for state deletions! Always mutate server-side memory (`serverDb`) AND cloud database so deletions sync across Desktop Computer and Mobile iPhone instantly.

## Verification Loop Checklist:
1. **TypeScript Check**: `npx tsc --noEmit` must return 0 errors.
2. **Jest Test Suite**: `npx jest` must pass 100%.
3. **Interactive Chrome DevTools MCP Verification**: Must verify live screens without console errors or layout pop.

# Workflow: Design System & Token Governance

This workflow guides agents through creating, inspecting, and enforcing a strict Design System to prevent visual regression during feature updates or bug fixes.

## Steps:
1. **Inspect Existing Tokens**: Read `DESIGN_SYSTEM.md`, `src/lib/tokens.ts`, and `src/app/globals.css`.
2. **Verify Component Contracts**: Ensure components use predefined token classes (`.glass-card`, `.btn-premium`) rather than ad-hoc inline styles.
3. **Run Typecheck & Verification**: Validate with `npx tsc --noEmit` and visual DevTools screenshot before completing turn.

# Mandatory 4-Point Interactive Quality Verification Rule

NEVER declare a task finished, resolved, or working without executing the comprehensive 4-point verification loop:

## Mandatory Verification Loop:
1. **TypeScript Compiler Check**: `npx tsc --noEmit` must return 0 errors.
2. **Jest Test Suite**: `npx jest` must pass 100%.
3. **Interactive Chrome DevTools MCP Testing**:
   - MUST navigate live pages (`/`, `/tasks`, `/habits`, `/calendar`, `/settings`).
   - MUST interactively click **EVERY button type** (create drawer triggers, status checkboxes, context pills, view mode toggles, tab switches, collapse sidebar).
   - MUST type test text into input fields and test every wireframe state.
   - MUST capture visual screenshots of verified screens.
4. **Security & Performance Audit**: Ensure all route handlers use `withErrorHandler` and UI interactions feel instantaneous.

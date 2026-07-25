# Workflow: 4-Point Quality Verification

Mandatory workflow before declaring any feature or bug fix completed.

## Steps:
1. **Typecheck**: Run `npx tsc --noEmit` and confirm 0 errors.
2. **Jest Test Suite**: Run `npx jest --passWithNoTests` and confirm 100% pass rate.
3. **DevTools Visual Inspection**: Navigate to `http://localhost:3000` via Chrome DevTools MCP and take viewport screenshot.
4. **Security Audit**: Ensure all route handlers are wrapped in `withErrorHandler`.

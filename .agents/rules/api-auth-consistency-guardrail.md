# API Authentication Consistency & Handover Checklist

## 🚨 Memorized Prevention Rule: Consistent Auth User Matching

### 1. Root Cause Analysis of `Failed to delete context`
- **Issue**: API routes in `/api/contexts/[id]/route.ts` hardcoded `LOCAL_USER_ID` ("local-user-id") instead of using `getAuthenticatedUserId()`.
- **Symptom**: When resources were created by the active session user ID from `getAuthenticatedUserId()`, DELETE/PATCH calls failed with 404/500 `Failed to delete context` HTTP error.

### 2. Required Handover Checklist (Must Check Before Handing Code to User)
Before completing any task or declaring success:
- [ ] **Auth ID Matching**: Ensure all dynamic API routes (`/api/*/[id]/route.ts`) use `getAuthenticatedUserId()` rather than static `LOCAL_USER_ID`.
- [ ] **Foreign Key Safety**: Verify database deletions handle cascading relations or fallback reassignments gracefully.
- [ ] **End-to-End Test Execution**: Run `npx tsc --noEmit` and `npm run test:unit` to guarantee zero build or runtime errors.

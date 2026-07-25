# Workflow: Architecture & Layer Governance

Guides agents through maintaining strict layer boundaries and file structure contracts.

## Steps:
1. **Locate Target Layer**:
   - UI Components ➔ `src/components/`
   - API Fetching Service ➔ `src/services/api.ts`
   - Reactive State Context ➔ `src/context/`
   - Shared Utilities ➔ `src/lib/`
   - Route Handlers ➔ `src/app/api/`
2. **Verify Naming Conventions**:
   - PascalCase for React component files (`TaskCard.tsx`).
   - camelCase for utility modules (`api-response.ts`, `user.ts`).
3. **Validate Layer Isolation**:
   - Components should consume `usePlannerStore()`, never make ad-hoc fetch calls or embed DB queries.

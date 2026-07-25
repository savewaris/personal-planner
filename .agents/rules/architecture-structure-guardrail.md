# Architecture & File Structure Guardrail Rule

You MUST strictly respect layer separation and file naming conventions:
- `src/components/`: React UI components (PascalCase, e.g. `TaskCard.tsx`).
- `src/services/`: Typed API client & data fetchers (`api.ts`).
- `src/context/` & `src/hooks/`: React state contexts & custom hooks (`PlannerStoreContext.tsx`).
- `src/lib/`: Server/shared helpers & utilities (`user.ts`, `api-response.ts`, `streak.ts`).
- `src/app/api/`: Next.js 16 REST API route handlers (`route.ts`).

Never place utility functions in `src/components/` or raw fetch calls directly in component event handlers.

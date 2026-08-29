# Next.js App Router & React Engineering Rules

## 1. Server vs. Client Component Boundaries

- **Default to Server Components**: Keep page components and data-fetching components as Server Components by default in `src/app/`.
- **Add `'use client'` explicitly**: Only add `'use client'` at the top of a file when the component requires:
  - React hooks (`useState`, `useEffect`, `useCallback`, `useMemo`, `useRef`).
  - Browser APIs (`window`, `localStorage`, `document`, custom DOM events).
  - Framer Motion animations (`motion.*`, `AnimatePresence`).
  - Interactive event listeners (`onClick`, `onChange`, `onSubmit`).
- **Push Client Boundaries Down**: Wrap interactive parts into isolated client components while keeping parent layouts/pages as Server Components.

---

## 2. API Route Handlers (`src/app/api/*`)

- Export named async functions (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`).
- In Next.js 15+, dynamic route params are Promises. Always `await params`.

---

## 3. Data Fetching & Caching

- In Server Components, fetch data directly using database clients or cached helpers.
- Never call internal `/api/*` endpoints from Server Components via `fetch()`.

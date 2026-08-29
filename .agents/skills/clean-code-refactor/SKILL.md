---
name: clean-code-refactor
description: Progressive runbook for decomposing monolithic files, modularizing composite components, isolating data access layers, and coordinating cross-CLI file locks across any stack.
recommended_model: pro
---

# Clean Code, Modularization & Concurrency Refactoring Runbook

This skill provides step-by-step procedures for safely refactoring monolithic components and data layers into atomic, isolated domain modules without regressions across any web or backend stack.

---

## 1. Decomposing Monolithic Data Access Layers

When refactoring a shared data layer (e.g. `src/lib/data.ts` in Next.js/Node, or `database.py` in Python):
1. **Acquire File Locks**:
   ```bash
   npm run agent:state -- --lock src/lib/data.ts src/lib/data/ --reason "Modularizing data fetchers"
   ```
2. **Create Domain Fetcher Files** inside a dedicated domain directory (e.g. `src/lib/data/` or `app/crud/`):
   - `skills.ts` -> `getSkills()`
   - `projects.ts` -> `getProjects()`
   - `experience.ts` -> `getExperiences()`
   - `education.ts` -> `getEducation()`
   - `interests.ts` -> `getInterests()`
   - `languages.ts` -> `getLanguages()`
   - `hobbies.ts` -> `getHobbies()`
   - `socials.ts` -> `getSocialLinks()`
   - `stats.ts` -> `getStats()`
3. **Create Barrel Aggregator (`src/lib/data/index.ts` or `__init__.py`)**:
   - Re-export all domain functions so existing imports like `import { getSkills } from '@/lib/data'` continue working seamlessly.
4. **Delete Old Monolith File**: Remove the monolithic file once verified.
5. **Release File Locks**:
   ```bash
   npm run agent:state -- --unlock src/lib/data.ts src/lib/data/
   ```

---

## 2. Decoupling Composite UI Section Components

When decoupling composite sections (e.g. `LanguagesInterestsSection.tsx` or monolithic views):
1. Identify the constituent domain concepts (e.g. `Languages`, `Interests`, `Hobbies`).
2. Create dedicated, atomic section components:
   - `src/components/sections/InterestsSection.tsx`
   - `src/components/sections/LanguagesSection.tsx`
   - `src/components/sections/HobbiesSection.tsx`
3. Update parent container (`src/app/page.tsx` or layout view) to compose the new atomic sections cleanly.
4. Verify responsive layout, spacing, and animations across all screen breakpoints.

---

## 3. Resolving Cross-CLI Lock Contention

If another active AI session or CLI window is modifying a locked file:
1. Run `npm run agent:state -- --locks` to identify the owner and lock reason.
2. Focus on unblocked subtasks (e.g. crafting component UI, writing CSS modules, or developing API route handlers).
3. Once the peer session releases the lock, proceed with the shared file modification.

---

## 4. Quality Gate Verification

After completing any refactoring:
```bash
npm run lint:fix
npx tsc --noEmit   # For TypeScript
npm run build      # For Web Apps
npm run agent:doctor
```

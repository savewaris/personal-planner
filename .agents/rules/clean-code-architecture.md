# Clean Code & Domain-Driven Modular Architecture Rules

## 1. Atomic Domain Decoupling & File Boundaries

- **Single-Responsibility Files**: Each file must have one clear, focused responsibility. Avoid monolithic files that aggregate multiple unrelated models or features.
- **Dedicated Domain Directories**: Place domain logic in dedicated subdirectories (e.g. `src/lib/data/[domain].ts` or `src/features/[domain]/`).
- **No Composite Mashup Components**: Never merge heterogeneous features into a single component file. Keep each domain decoupled so distinct tasks can be worked on concurrently without merge conflicts.

---

## 2. Cross-CLI Dynamic File-Locking Protocol

When multiple AI agent sessions or CLI windows run simultaneously:
1. **Declare File Locks Before Modifying**:
   ```bash
   npm run agent:state -- --lock <filepath...> --reason "<task description>"
   ```
2. **Respect Existing Locks**:
   - Check locks via `npm run agent:state -- --locks`.
   - If a target file is locked by another session, proceed with independent unblocked files first.
3. **Release Locks Promptly**:
   - Release lock immediately upon step/task completion:
     ```bash
     npm run agent:state -- --unlock <filepath...>
     ```
   - When a task is marked done (`npm run agent:state -- --done`), all locks owned by that task are released automatically.

---

## 3. Import & Dependency Hygiene

- Use clean module aliases (e.g. `@/lib/...`, `@/components/...`).
- Maintain explicit barrel aggregators (`index.ts`) for backward compatibility.
- Zero dead code: prune unused imports, obsolete variables, and debug logs.

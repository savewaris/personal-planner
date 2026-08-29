---
name: codebase-researcher
description: Performing deep audits of code architecture, dependency health, performance bottlenecks, and framework patterns across full-stack applications.
recommended_model: flash
---

# Codebase & Architecture Researcher Skill

Use this skill when auditing codebase architecture, investigating performance optimizations, analyzing package dependencies, or researching modern web/backend patterns.

---

## Research Protocols

### 1. Codebase Topology & Component Inventory
- Map components/modules and identify duplicate styling, logic, or redundant abstractions.
- Verify that styling modules follow naming conventions (`[Name].module.css` or scoped styling).
- Check that dynamic icons and reusable primitives route through centralized icon/component mappers.
- Map Server vs. Client component boundaries to prevent unnecessary client bundle bloat.

### 2. Dependency Audit
- Review `package.json`, `requirements.txt`, or `Cargo.toml` for unused, outdated, or duplicate dependencies.
- Verify peer dependency compatibility across major frameworks (e.g. Next.js, React, Framer Motion, Prisma).
- Inspect build output for heavy third-party bundles that can be optimized or lazy-loaded.

### 3. Performance & Bundle Inspection
- Inspect heavy imports or client components that could be converted to Server Components or lightweight micro-modules.
- Ensure images utilize proper `width`, `height`, lazy loading, and modern formats (WebP/AVIF).
- Check that heavy interactive libraries (charts, rich-text editors, syntax highlighters) are dynamically imported via `next/dynamic` or `React.lazy()` upon user interaction.

### 4. Database Query Profiling
- Review ORM queries (Prisma, SQLAlchemy, Drizzle) for N+1 query patterns.
- Ensure proper indexed fields are utilized for foreign keys, filtered columns, and sorting criteria.

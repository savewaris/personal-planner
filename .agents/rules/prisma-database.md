# Prisma ORM & Database Engineering Rules

## 1. Schema Location & Client Singleton

- **Schema File**: `prisma/schema.prisma`
- **Singleton Import**: Always import database client from `@/lib/prisma` singleton module. Never instantiate multiple clients.

---

## 2. Schema Evolution Guidelines

- When modifying `prisma/schema.prisma`:
  1. Add default values for new non-nullable columns (e.g. `@default("General")` or `@default(0)`).
  2. Use optional types (`String?`, `Int?`) for non-breaking additions.
  3. Maintain index integrity on foreign keys or frequently queried fields.
  4. Always run `npx prisma validate` immediately after editing the schema.
  5. Run `npx prisma generate` to refresh client types.
  6. In local development with SQLite, use `npx prisma db push` to synchronize tables without losing existing seed data.

---

## 3. Data Safety & Query Patterns

- Select only required fields and use explicit relations.
- Provide deterministic sorting (`orderBy`).
- Wrap operations in `try / catch` blocks and handle known ORM error codes.

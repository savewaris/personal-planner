---
name: prisma-schema-migration
description: Runbook for safely updating Prisma schema, executing database migrations, regenerating Prisma Client, and verifying database integrity.
recommended_model: pro
---

# Prisma Schema & Database Migration Skill

This skill provides step-by-step instructions for executing schema changes safely in projects utilizing Prisma ORM with SQLite, PostgreSQL, MySQL, or Neon.

---

## Migration Runbook

### Step 1: Pre-Migration Check
- Review existing models and relationships in `prisma/schema.prisma`.
- Ensure no active conflicting locks on the database file or active client connections.
- Ensure `DATABASE_URL` is set properly in `.env`.

### Step 2: Edit Schema
- Add or modify model attributes and relations.
- **Data Safety Rule**: Ensure all new non-optional fields specify a `@default(...)` value or are marked optional (`?`) to prevent breaking existing table records.
- Example:
  ```prisma
  model Project {
    id          String   @id @default(cuid())
    title       String
    description String
    category    String   @default("Web")
    featured    Boolean  @default(false)
    order       Int      @default(0)
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt

    @@index([category])
    @@index([featured])
  }
  ```

### Step 3: Validate Syntax
```bash
npx prisma validate
```

### Step 4: Synchronize Database
- **For local prototyping / SQLite**:
  ```bash
  npx prisma db push
  ```
- **For production / CI/CD environments (SQL migrations)**:
  ```bash
  npx prisma migrate dev --name <descriptive_migration_name>
  ```

### Step 5: Regenerate Client
```bash
npx prisma generate
```

### Step 6: TypeScript & Query Integrity Check
```bash
npx tsc --noEmit
npm run agent:doctor
```

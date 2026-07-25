# Handoff Report: Personal Mode Core & Data Seeding (Milestone PM-1)

## 1. Observation

### Codebase Inspection Findings
- **Prisma Schema (`prisma/schema.prisma`)**:
  - `User` model (lines 11–25):
    ```prisma
    model User {
      id            String    @id @default(uuid())
      name          String?
      email         String?   @unique
      emailVerified DateTime?
      image         String?
      password      String?
      createdAt     DateTime  @default(now())
      updatedAt     DateTime  @updatedAt
      accounts      Account[]
      sessions      Session[]
      contexts      Context[]
      habits        Habit[]
    }
    ```
    - Note: The `id` field is a `String`. While Prisma provides `@default(uuid())`, custom string IDs such as `"local"` are supported natively by Prisma Client when creating records explicitly with `id: "local"`.
  - `Context` model (lines 66–80):
    ```prisma
    model Context {
      id        String    @id @default(uuid())
      name      String
      color     String?
      createdAt DateTime  @default(now())
      updatedAt DateTime  @updatedAt
      userId    String
      user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
      projects  Project[]
      tasks     Task[]
      @@index([userId])
    }
    ```
    - Foreign key `userId` references `User.id`. When creating default context for local user, `userId: "local"` must be supplied.

- **Prisma Client Singleton (`src/lib/prisma.ts`)**:
  - Exports standard `prisma` client (lines 7–11).
  - No auto-seeding middleware or custom client wrapper is currently attached to `prisma.ts`.

- **Current Auth Utility (`src/lib/auth.ts`)**:
  - Defines `authOptions: NextAuthOptions` using `PrismaAdapter(prisma)` and `CredentialsProvider`/`GoogleProvider`/`GithubProvider`/`EmailProvider`.
  - API route handlers (`/api/contexts`, `/api/tasks`, `/api/habits`) currently invoke `await getServerSession(authOptions)` and check `!session || !session.user?.id` before returning 401 Unauthorized responses.

- **Existing Registration Seeding Logic (`src/app/api/auth/register/route.ts`)**:
  - Lines 56–62 show how initial contexts are created during user setup:
    ```typescript
    await tx.context.create({
      data: {
        name: "Personal",
        color: "#3B82F6",
        userId: user.id,
      },
    });
    ```
  - Color convention for default Personal context is `#3B82F6`.

- **Database Seeds**:
  - Search returned 0 seed files (`prisma/seed.ts` does not yet exist).

---

## 2. Logic Chain

1. **Eliminating NextAuth Session Barriers for Personal Mode**:
   - In single-user Personal Mode, user authentication prompts and NextAuth session dependencies must be bypassed for database operations.
   - All workspace data (contexts, projects, tasks, habits) must belong to a single deterministic user account with `id: "local"`.

2. **Database Guarantee & Idempotence**:
   - Any database interaction in Personal Mode requires that the `User` record with `id: "local"`, `email: "local@personal.mode"`, and `name: "Local User"` exists.
   - A `Context` record with `name: "Personal"`, `color: "#3B82F6"`, and `userId: "local"` must also exist as the default workspace context.
   - To guarantee this without manual database setup or throwing runtime errors when the database is empty/reset, an auto-seeding helper function `getOrCreateLocalUser()` is needed.

3. **Auto-Seeding Helper Architecture (`src/lib/user.ts`)**:
   - `getOrCreateLocalUser()` must execute an atomic transaction or `upsert` query:
     - Check if user with `id: "local"` exists in the database.
     - If missing, upsert/create user record (`id: "local"`, `email: "local@personal.mode"`, `name: "Local User"`) alongside the default `Context` record (`name: "Personal"`, `color: "#3B82F6"`).
     - If user exists but has 0 associated contexts, seed the default `Context` record for `userId: "local"`.
     - Return the hydrated local user object with context relations.

4. **Integration Surface**:
   - `src/lib/user.ts` will serve as the single source of truth for local user management across API routes, server components, and test utilities.
   - API routes in Milestone PM-2 will call `getOrCreateLocalUser()` or reference `LOCAL_USER_ID` ("local") instead of calling `getServerSession(authOptions)`.

---

## 3. Caveats

1. **Email Uniqueness Constraint**:
   - If an existing record in the database already has `email: "local@personal.mode"` with a different UUID `id`, `prisma.user.create` with `id: "local"` will fail due to `@unique` constraint on `email`.
   - *Mitigation*: The `getOrCreateLocalUser()` helper handles this by searching first by `id: "local"` or `email: "local@personal.mode"`. If found by email with a different ID, it cleans up or updates the existing record.
2. **Concurrency / Cold Starts**:
   - Concurrent Next.js API requests during server startup could call `getOrCreateLocalUser()` simultaneously.
   - *Mitigation*: Use Prisma `upsert` or `$transaction` with nested creation, which SQLite/PostgreSQL handle safely.
3. **Primary Key Type Compatibility**:
   - Prisma schema defines `User.id` as `String @id @default(uuid())`. Passing `"local"` manually is fully valid in Prisma for `String` primary keys.

---

## 4. Conclusion & Proposed Code Implementation

### Proposed File 1: `src/lib/user.ts` (New File)
Create `src/lib/user.ts` to implement constants and the auto-seeding provider helper:

```typescript
import { prisma } from "@/lib/prisma";

export const LOCAL_USER_ID = "local";
export const LOCAL_USER_EMAIL = "local@personal.mode";
export const LOCAL_USER_NAME = "Local User";

export const DEFAULT_CONTEXT_NAME = "Personal";
export const DEFAULT_CONTEXT_COLOR = "#3B82F6";

export async function getOrCreateLocalUser() {
  // 1. Check if local user already exists with contexts
  let user = await prisma.user.findUnique({
    where: { id: LOCAL_USER_ID },
    include: { contexts: true },
  });

  // 2. If not found by ID, check if email exists to avoid unique constraint conflict
  if (!user) {
    const existingByEmail = await prisma.user.findUnique({
      where: { email: LOCAL_USER_EMAIL },
      include: { contexts: true },
    });

    if (existingByEmail) {
      user = existingByEmail;
    }
  }

  // 3. If user profile doesn't exist, create it with default Personal context
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: LOCAL_USER_ID,
        name: LOCAL_USER_NAME,
        email: LOCAL_USER_EMAIL,
        contexts: {
          create: {
            name: DEFAULT_CONTEXT_NAME,
            color: DEFAULT_CONTEXT_COLOR,
          },
        },
      },
      include: { contexts: true },
    });
  }

  // 4. Ensure at least one context exists for local user
  if (user.contexts.length === 0) {
    const defaultContext = await prisma.context.create({
      data: {
        name: DEFAULT_CONTEXT_NAME,
        color: DEFAULT_CONTEXT_COLOR,
        userId: user.id,
      },
    });
    user.contexts = [defaultContext];
  }

  return user;
}
```

### Proposed File 2: `prisma/seed.ts` (New File - Optional / Standalone Seed Script)
Create `prisma/seed.ts` for explicit `prisma db seed` commands:

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const localUser = await prisma.user.upsert({
    where: { id: "local" },
    update: {},
    create: {
      id: "local",
      name: "Local User",
      email: "local@personal.mode",
      contexts: {
        create: {
          name: "Personal",
          color: "#3B82F6",
        },
      },
    },
    include: { contexts: true },
  });

  console.log("Seeded local user:", localUser.id, localUser.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Proposed File 3: `package.json` Updates
Add Prisma seed script entry to `package.json` under `"prisma"`:

```json
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
```

---

## 5. Verification Method

To verify the implementation of Milestone PM-1 once written by Implementer:

1. **Unit Test Verification**:
   - Run `npm run test:unit`
   - Execute a dedicated unit test suite for `getOrCreateLocalUser()` verifying:
     - Returns user with `id === "local"`, `email === "local@personal.mode"`, `name === "Local User"`.
     - Returns default context with `name === "Personal"`, `color === "#3B82F6"`, `userId === "local"`.
     - Idempotent behavior on subsequent calls.

2. **Prisma Database Direct Check**:
   - Inspect database state after invoking `getOrCreateLocalUser()` or running `npx prisma db seed`.
   - Verify `User` table contains entry `{ id: "local", email: "local@personal.mode", name: "Local User" }`.
   - Verify `Context` table contains entry `{ name: "Personal", color: "#3B82F6", userId: "local" }`.

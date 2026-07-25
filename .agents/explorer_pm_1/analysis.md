# Personal Mode Transition (R1 & R3) — Technical Analysis & Implementation Strategy

**Target Working Directory**: `d:/save/Antigravity/Planner/`  
**Explorer Agent**: Explorer PM-1  
**Date**: 2026-07-23  

---

## Executive Summary
This analysis details the technical transition of the Planner application from NextAuth session-based multi-user authentication to **Personal Mode** (No Auth Barrier). In Personal Mode:
1. All backend API route handlers operate directly under a default local user (`userId: "local"`).
2. All NextAuth session checks and `401 Unauthorized` responses in API routes are removed.
3. A robust auto-seeding helper `getOrCreateLocalUser()` ensures the `User` (`id: "local"`, `email: "local@personal.mode"`, `name: "Personal User"`) and a default "Personal" `Context` (`color: "#3B82F6"`) exist in the database (SQLite or PostgreSQL) whenever API routes or the application start.

---

## 1. Observation (Current Codebase Audit)

### 1.1 Auth & Database Core
- **`prisma/schema.prisma`**:
  - `User` model (`lines 11-25`):
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
    *Observation*: `id` is a `String`. Supplying an explicit string ID like `"local"` is natively supported without schema changes or database migrations.
- **`src/lib/auth.ts`**:
  - Currently contains `authOptions` with NextAuth providers (Credentials, Google, GitHub, Email), `PrismaAdapter`, JWT strategy, and session callbacks (`lines 10-64`).
- **`src/lib/prisma.ts`**:
  - Exports global singleton `prisma` client (`PrismaClient`).

---

### 1.2 Audit of Session Checks in Route Handlers

Every single API route currently imports `getServerSession` from `next-auth` and returns a `{ error: "Unauthorized" }, { status: 401 }` response if no session exists:

#### 1. `src/app/api/contexts/route.ts`
- **GET** (`lines 8-14`):
  ```ts
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;
  ```
- **POST** (`lines 37-43`):
  ```ts
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;
  ```

#### 2. `src/app/api/contexts/[id]/route.ts`
- **PATCH** (`lines 14-20`):
  ```ts
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;
  ```
- **DELETE** (`lines 85-91`):
  ```ts
  const session = await getServerSession(authOptions);
  if (!session || !(session.user as any)?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;
  ```

#### 3. `src/app/api/tasks/route.ts`
- **GET** (`lines 8-11` & `lines 24-26`):
  ```ts
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // context filter: userId: session.user.id
  ```
- **POST** (`lines 64-67` & `lines 87-92`):
  ```ts
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // context ownership check: userId: session.user.id
  ```

#### 4. `src/app/api/tasks/[id]/route.ts`
- **PATCH** (`lines 11-14`, `line 26`, `line 66`):
  ```ts
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // task ownership check: context.userId === session.user.id
  ```
- **DELETE** (`lines 110-113`, `line 126`):
  ```ts
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // task ownership check: context.userId === session.user.id
  ```

#### 5. `src/app/api/habits/route.ts`
- **GET** (`lines 9-12`, `line 18`):
  ```ts
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // habit lookup: where: { userId: session.user.id }
  ```
- **POST** (`lines 60-63`, `line 79`):
  ```ts
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // habit create: userId: session.user.id
  ```

#### 6. `src/app/api/habits/[id]/log/route.ts`
- **POST** (`lines 12-15`, `line 36`):
  ```ts
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // habit check: habit.userId !== session.user.id
  ```

---

## 2. Logic Chain

1. **Prisma Primary Key Compatibility**:
   - `User.id` is typed as `String`. In Prisma/PostgreSQL/SQLite, passing `id: "local"` during user creation works natively. `@default(uuid())` is only invoked when `id` is omitted.
2. **Local User Auto-Seeding Requirement**:
   - Every read/write operation needs to ensure `User(id: "local")` exists in the database.
   - Creating a centralized utility function `getOrCreateLocalUser()` inside `src/lib/auth.ts` guarantees that even on a fresh database, any API request will automatically create the `local` user and a default `"Personal"` context before performing queries.
3. **Session Check Removal**:
   - Replacing `getServerSession(authOptions)` with `await getOrCreateLocalUser()` and setting `userId = LOCAL_USER_ID` ("local") eliminates all authentication barriers.
   - Eliminating the `if (!session) return 401` block ensures that requests without session cookies or authorization headers execute successfully.
4. **Database Seeding Strategy**:
   - Adding a CLI seeding script (`prisma/seed.ts`) allows pre-seeding during deployment/CI (`npx prisma db seed`), while `getOrCreateLocalUser()` acts as a runtime fallback safety net.

---

## 3. Recommended Implementation Plan

### Step 1: Create Local User Helper (`src/lib/auth.ts`)
Add the following constants and `getOrCreateLocalUser()` function to `src/lib/auth.ts`:

```ts
import { prisma } from "@/lib/prisma";

export const LOCAL_USER_ID = "local";
export const LOCAL_USER_EMAIL = "local@personal.mode";
export const LOCAL_USER_NAME = "Personal User";

export async function getOrCreateLocalUser() {
  let user = await prisma.user.findUnique({
    where: { id: LOCAL_USER_ID },
  });

  if (!user) {
    user = await prisma.user.upsert({
      where: { id: LOCAL_USER_ID },
      update: {},
      create: {
        id: LOCAL_USER_ID,
        email: LOCAL_USER_EMAIL,
        name: LOCAL_USER_NAME,
      },
    });
  }

  // Ensure default "Personal" context exists
  const existingContext = await prisma.context.findFirst({
    where: { userId: LOCAL_USER_ID },
  });

  if (!existingContext) {
    await prisma.context.create({
      data: {
        name: "Personal",
        color: "#3B82F6",
        userId: LOCAL_USER_ID,
      },
    });
  }

  return user;
}
```

---

### Step 2: Simplified API Route Handlers

#### 1. `src/app/api/contexts/route.ts`
```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrCreateLocalUser, LOCAL_USER_ID } from "@/lib/auth";

export async function GET() {
  try {
    await getOrCreateLocalUser();
    const contexts = await prisma.context.findMany({
      where: { userId: LOCAL_USER_ID },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(contexts, { status: 200 });
  } catch (error) {
    console.error("GET /api/contexts error:", error);
    return NextResponse.json({ error: "Failed to fetch contexts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await getOrCreateLocalUser();
    const body = await request.json();
    const rawName = body?.name;
    const rawColor = body?.color || "blue";

    if (typeof rawName !== "string" || rawName.trim().length === 0) {
      return NextResponse.json({ error: "Context name cannot be empty" }, { status: 400 });
    }
    const trimmedName = rawName.trim();
    if (trimmedName.length > 50) {
      return NextResponse.json({ error: "Context name exceeds maximum length of 50 characters" }, { status: 400 });
    }

    const color = typeof rawColor === "string" ? rawColor.trim() || "blue" : "blue";

    const newContext = await prisma.context.create({
      data: {
        name: trimmedName,
        color,
        userId: LOCAL_USER_ID,
      },
    });

    return NextResponse.json(newContext, { status: 201 });
  } catch (error) {
    console.error("POST /api/contexts error:", error);
    return NextResponse.json({ error: "Failed to create context" }, { status: 500 });
  }
}
```

#### 2. `src/app/api/contexts/[id]/route.ts`
```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { LOCAL_USER_ID } from "@/lib/auth";

interface ContextRouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: ContextRouteParams) {
  try {
    const { id } = await params;
    const existingContext = await prisma.context.findUnique({ where: { id } });

    if (!existingContext || existingContext.userId !== LOCAL_USER_ID) {
      return NextResponse.json({ error: "Context not found" }, { status: 404 });
    }

    const body = await request.json();
    const updateData: { name?: string; color?: string } = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim().length === 0) {
        return NextResponse.json({ error: "Context name cannot be empty" }, { status: 400 });
      }
      if (body.name.trim().length > 50) {
        return NextResponse.json({ error: "Context name exceeds maximum length of 50 characters" }, { status: 400 });
      }
      updateData.name = body.name.trim();
    }

    if (body.color !== undefined && typeof body.color === "string") {
      updateData.color = body.color.trim();
    }

    const updatedContext = await prisma.context.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedContext, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/contexts/[id] error:", error);
    return NextResponse.json({ error: "Failed to update context" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: ContextRouteParams) {
  try {
    const { id } = await params;
    const existingContext = await prisma.context.findUnique({ where: { id } });

    if (!existingContext || existingContext.userId !== LOCAL_USER_ID) {
      return NextResponse.json({ error: "Context not found" }, { status: 404 });
    }

    await prisma.context.delete({ where: { id } });
    return NextResponse.json({ success: true, id, message: "Context deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/contexts/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete context" }, { status: 500 });
  }
}
```

#### 3. `src/app/api/tasks/route.ts`
```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateLocalUser, LOCAL_USER_ID } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    await getOrCreateLocalUser();
    const { searchParams } = new URL(req.url);
    const rawContextId = searchParams.get('contextId');
    const contextId =
      rawContextId &&
      rawContextId.trim() !== '' &&
      rawContextId.trim() !== 'null' &&
      rawContextId.trim() !== 'undefined'
        ? rawContextId.trim()
        : null;

    const whereClause: any = {
      context: { userId: LOCAL_USER_ID },
    };

    if (contextId) {
      whereClause.contextId = contextId;
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        context: { select: { id: true, name: true, color: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    console.error('GET /api/tasks error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await getOrCreateLocalUser();
    const body = await req.json();
    const { title, description, contextId, projectId } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (title.length > 255) {
      return NextResponse.json({ error: 'Title exceeds 255 characters' }, { status: 400 });
    }
    if (description && (typeof description !== 'string' || description.length > 5000)) {
      return NextResponse.json({ error: 'Description exceeds 5000 characters' }, { status: 400 });
    }
    if (!contextId || typeof contextId !== 'string' || contextId.trim().length === 0) {
      return NextResponse.json({ error: 'contextId is required' }, { status: 400 });
    }

    const targetContext = await prisma.context.findFirst({
      where: { id: contextId, userId: LOCAL_USER_ID },
    });

    if (!targetContext) {
      return NextResponse.json({ error: 'Context not found or access denied' }, { status: 400 });
    }

    if (projectId) {
      const targetProject = await prisma.project.findFirst({
        where: { id: projectId, contextId },
      });
      if (!targetProject) {
        return NextResponse.json({ error: 'Project not found in specified context' }, { status: 400 });
      }
    }

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description ? description.trim() : null,
        contextId,
        projectId: projectId || null,
      },
      include: {
        context: { select: { id: true, name: true, color: true } },
        project: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('POST /api/tasks error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

#### 4. `src/app/api/tasks/[id]/route.ts`
```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LOCAL_USER_ID } from '@/lib/auth';

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await context.params;
    const taskId = resolvedParams.id;
    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        context: { userId: LOCAL_USER_ID },
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const body = await req.json();
    const { completed, title, description, contextId, projectId } = body;
    const updateData: any = {};

    if (typeof completed === 'boolean') {
      updateData.completed = completed;
    }
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
      }
      if (title.length > 255) {
        return NextResponse.json({ error: 'Title exceeds 255 characters' }, { status: 400 });
      }
      updateData.title = title.trim();
    }
    if (description !== undefined) {
      if (description !== null && (typeof description !== 'string' || description.length > 5000)) {
        return NextResponse.json({ error: 'Description exceeds 5000 characters' }, { status: 400 });
      }
      updateData.description = description ? description.trim() : null;
    }
    if (contextId !== undefined) {
      const targetContext = await prisma.context.findFirst({
        where: { id: contextId, userId: LOCAL_USER_ID },
      });
      if (!targetContext) {
        return NextResponse.json({ error: 'Target context not found or access denied' }, { status: 400 });
      }
      updateData.contextId = contextId;
    }
    if (projectId !== undefined) {
      updateData.projectId = projectId || null;
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        context: { select: { id: true, name: true, color: true } },
        project: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error) {
    console.error('PATCH /api/tasks/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await context.params;
    const taskId = resolvedParams.id;
    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        context: { userId: LOCAL_USER_ID },
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    await prisma.task.delete({ where: { id: taskId } });
    return NextResponse.json({ success: true, message: 'Task deleted' }, { status: 200 });
  } catch (error) {
    console.error('DELETE /api/tasks/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

#### 5. `src/app/api/habits/route.ts`
```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateStreak, formatDateKey } from '@/lib/streak';
import { getOrCreateLocalUser, LOCAL_USER_ID } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await getOrCreateLocalUser();
    const { searchParams } = new URL(request.url);
    const targetDateStr = searchParams.get('date') || formatDateKey(new Date());

    const habits = await prisma.habit.findMany({
      where: { userId: LOCAL_USER_ID },
      include: {
        logs: { orderBy: { date: 'desc' } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const formattedHabits = habits.map((habit: any) => {
      const formattedLogs = habit.logs.map((log: any) => ({
        id: log.id,
        habitId: log.habitId,
        date: formatDateKey(log.date),
        completed: log.completed,
      }));

      const computedStreak = calculateStreak(formattedLogs);
      const todayLog = formattedLogs.find((l: any) => l.date === targetDateStr);
      const completedToday = todayLog ? todayLog.completed : false;

      return {
        id: habit.id,
        name: habit.name,
        streak: computedStreak,
        userId: habit.userId,
        createdAt: habit.createdAt.toISOString(),
        updatedAt: habit.updatedAt.toISOString(),
        logs: formattedLogs,
        completedToday,
      };
    });

    return NextResponse.json(formattedHabits, { status: 200 });
  } catch (error) {
    console.error('GET /api/habits error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await getOrCreateLocalUser();
    const body = await request.json();
    const name = body.name?.trim();

    if (!name || typeof name !== 'string' || name.length === 0) {
      return NextResponse.json({ error: 'Habit name is required' }, { status: 400 });
    }
    if (name.length > 100) {
      return NextResponse.json({ error: 'Habit name exceeds 100 characters' }, { status: 400 });
    }

    const newHabit = await prisma.habit.create({
      data: {
        name,
        userId: LOCAL_USER_ID,
        streak: 0,
      },
      include: { logs: true },
    });

    return NextResponse.json(
      {
        id: newHabit.id,
        name: newHabit.name,
        streak: 0,
        userId: newHabit.userId,
        createdAt: newHabit.createdAt.toISOString(),
        updatedAt: newHabit.updatedAt.toISOString(),
        logs: [],
        completedToday: false,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/habits error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

#### 6. `src/app/api/habits/[id]/log/route.ts`
```ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateStreak, formatDateKey } from '@/lib/streak';
import { LOCAL_USER_ID } from '@/lib/auth';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await context.params;
    const habitId = resolvedParams.id;

    if (!habitId) {
      return NextResponse.json({ error: 'Habit ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { completed, date: customDate } = body;

    if (typeof completed !== 'boolean') {
      return NextResponse.json({ error: 'Field "completed" must be a boolean' }, { status: 400 });
    }

    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
      include: { logs: true },
    });

    if (!habit || habit.userId !== LOCAL_USER_ID) {
      return NextResponse.json({ error: 'Habit not found' }, { status: 404 });
    }

    const targetDateStr = customDate ? formatDateKey(customDate) : formatDateKey(new Date());
    const targetMidnight = new Date(`${targetDateStr}T00:00:00.000Z`);

    const existingLog = habit.logs.find(
      (log: any) => formatDateKey(log.date) === targetDateStr
    );

    if (existingLog) {
      await prisma.habitLog.update({
        where: { id: existingLog.id },
        data: { completed },
      });
    } else {
      await prisma.habitLog.create({
        data: {
          habitId,
          date: targetMidnight,
          completed,
        },
      });
    }

    const updatedLogs = await prisma.habitLog.findMany({ where: { habitId } });
    const formattedLogs = updatedLogs.map((log: any) => ({
      id: log.id,
      habitId: log.habitId,
      date: formatDateKey(log.date),
      completed: log.completed,
    }));

    const newStreak = calculateStreak(formattedLogs);

    const updatedHabit = await prisma.habit.update({
      where: { id: habitId },
      data: { streak: newStreak },
      include: { logs: true },
    });

    const todayLog = formattedLogs.find((l: any) => l.date === targetDateStr);

    return NextResponse.json({
      id: updatedHabit.id,
      name: updatedHabit.name,
      streak: newStreak,
      userId: updatedHabit.userId,
      createdAt: updatedHabit.createdAt.toISOString(),
      updatedAt: updatedHabit.updatedAt.toISOString(),
      logs: formattedLogs,
      completedToday: todayLog ? todayLog.completed : false,
    }, { status: 200 });
  } catch (error) {
    console.error('POST /api/habits/[id]/log error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

---

### Step 3: Database Seeding Script (`prisma/seed.ts`)
Create `prisma/seed.ts` to support optional CLI seeding via `npx prisma db seed`:

```ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const localUser = await prisma.user.upsert({
    where: { id: "local" },
    update: {},
    create: {
      id: "local",
      email: "local@personal.mode",
      name: "Personal User",
    },
  });

  const personalContext = await prisma.context.findFirst({
    where: { userId: "local", name: "Personal" },
  });

  if (!personalContext) {
    await prisma.context.create({
      data: {
        name: "Personal",
        color: "#3B82F6",
        userId: "local",
      },
    });
  }

  console.log("Database seeded with default Personal Mode user and context.");
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

---

## 4. Caveats & Assumptions

- **Schema Changes**: No Prisma schema changes are required because `User.id` is typed as `String`. String IDs like `"local"` work natively in SQLite and PostgreSQL.
- **Frontend Alignment**: Although API endpoints will no longer return `401 Unauthorized`, client components that depend on `useSession()` status (such as `src/app/page.tsx` rendering `<HeroSection />` when `status === "unauthenticated"`) will need frontend adjustments to default to authenticated/personal mode view.
- **Authentication Endpoints**: `/api/auth/register` and `/api/auth/[...nextauth]` can remain untouched or deprecated as they won't be called by the application flow in Personal Mode.

---

## 5. Conclusion
Transitioning to Personal Mode requires:
1. Exporting `LOCAL_USER_ID = "local"` and `getOrCreateLocalUser()` in `src/lib/auth.ts`.
2. Replacing all `getServerSession()` calls across 6 API route files with `await getOrCreateLocalUser()` and `LOCAL_USER_ID`.
3. Adding optional CLI seeding script in `prisma/seed.ts`.

---

## 6. Verification Method

To verify the implementation once applied:
1. **Reset / Migrate DB**: `npx prisma db push --force-reset`
2. **API Endpoint Verification (curl / fetch without session cookies)**:
   - `GET /api/contexts` -> Should return status 200 with `[{ id: "...", name: "Personal", color: "#3B82F6", userId: "local" }]`.
   - `POST /api/contexts` with `{ "name": "Work", "color": "purple" }` -> Should return status 201 with `userId: "local"`.
   - `GET /api/tasks` -> Should return status 200 (empty array or existing tasks).
   - `POST /api/tasks` with `{ "title": "Test Task", "contextId": "<context-id>" }` -> Should return status 201.
   - `GET /api/habits` -> Should return status 200.
   - `POST /api/habits` with `{ "name": "Morning Run" }` -> Should return status 201.
3. **Automated Integration Tests**:
   - Run `npm test` or `npx jest` to ensure route tests pass without requiring mock sessions.

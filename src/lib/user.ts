/**
 * Local User Helper — Personal Mode (Neon PostgreSQL Sync)
 *
 * This module eliminates all authentication barriers by providing a single,
 * deterministic local user identity. Every API route and data operation
 * references this constant instead of extracting userId from a session.
 *
 * The `getOrCreateLocalUser()` function ensures the local user, default
 * contexts, tasks, habits, and notes always exist in Neon PostgreSQL,
 * auto-seeding on first run so all devices (Computer & iPhone) see data!
 */

import { prisma } from "@/lib/prisma";

// ─── Constants ──────────────────────────────────────────────────────────────
export const LOCAL_USER_ID = "local";
export const LOCAL_USER_EMAIL = "local@personal.mode";
export const LOCAL_USER_NAME = "Personal User";

// ─── Default Seed Data ──────────────────────────────────────────────────────
const DEFAULT_CONTEXTS = [
  { id: "ctx-personal", name: "Personal", color: "blue", userId: LOCAL_USER_ID },
  { id: "ctx-work", name: "Work", color: "emerald", userId: LOCAL_USER_ID },
  { id: "ctx-freelance", name: "Freelance", color: "purple", userId: LOCAL_USER_ID },
];

const DEFAULT_TASKS = [
  {
    id: "task-1",
    title: "Review Q3 client project deliverables",
    description: "Audit milestone progress and draft status report.",
    completed: true,
    status: "DONE",
    priority: "MEDIUM",
    tags: JSON.stringify(["freelance", "review"]),
    contextId: "ctx-freelance",
  },
  {
    id: "task-2",
    title: "Finish API route handler implementation",
    description: "Ensure Next.js 16 awaited params pattern across all route files.",
    completed: true,
    status: "DONE",
    priority: "HIGH",
    tags: JSON.stringify(["dev", "backend"]),
    contextId: "ctx-work",
  },
  {
    id: "task-3",
    title: "Morning 30-min walk & stretch",
    description: "Get sunlight and fresh air before starting deep work.",
    completed: true,
    status: "DONE",
    priority: "MEDIUM",
    tags: JSON.stringify(["health"]),
    contextId: "ctx-personal",
  },
];

const DEFAULT_HABITS = [
  { id: "habit-1", name: "Morning Meditation (10 mins)", streak: 1, userId: LOCAL_USER_ID },
  { id: "habit-2", name: "Read 15 Pages of a Book", streak: 1, userId: LOCAL_USER_ID },
  { id: "habit-3", name: "Workout", streak: 0, userId: LOCAL_USER_ID },
];

const DEFAULT_NOTES = [
  {
    id: "note-1",
    content: "Ideas for UI polish: add dark glass card micro-animations and quick action drawer",
    userId: LOCAL_USER_ID,
  },
  {
    id: "note-2",
    content: "Buy noise-canceling headphones for deep focus work sessions",
    userId: LOCAL_USER_ID,
  },
];

// ─── User Bootstrap & Seeding ─────────────────────────────────────────────────
export async function getOrCreateLocalUser() {
  if (!process.env.DATABASE_URL) {
    return {
      id: LOCAL_USER_ID,
      email: LOCAL_USER_EMAIL,
      name: LOCAL_USER_NAME,
      contexts: DEFAULT_CONTEXTS,
    };
  }

  try {
    // 1. Upsert local user
    const user = await prisma.user.upsert({
      where: { id: LOCAL_USER_ID },
      update: {},
      create: {
        id: LOCAL_USER_ID,
        email: LOCAL_USER_EMAIL,
        name: LOCAL_USER_NAME,
      },
      include: {
        contexts: true,
      },
    });

    // 2. Seed contexts if empty
    if (user.contexts.length === 0) {
      await prisma.context.createMany({
        data: DEFAULT_CONTEXTS,
        skipDuplicates: true,
      });
    }

    // 3. Seed tasks if empty
    const taskCount = await prisma.task.count();
    if (taskCount === 0) {
      await prisma.task.createMany({
        data: DEFAULT_TASKS,
        skipDuplicates: true,
      });
    }

    // 4. Seed habits if empty
    const habitCount = await prisma.habit.count();
    if (habitCount === 0) {
      await prisma.habit.createMany({
        data: DEFAULT_HABITS,
        skipDuplicates: true,
      });

      // Add initial habit log for completed habits
      const todayStr = new Date().toISOString().split("T")[0];
      await prisma.habitLog.createMany({
        data: [
          { habitId: "habit-1", date: todayStr, completed: true },
          { habitId: "habit-2", date: todayStr, completed: true },
        ],
        skipDuplicates: true,
      });
    }

    // 5. Seed notes if empty
    if ((prisma as any).note) {
      const noteCount = await (prisma as any).note.count();
      if (noteCount === 0) {
        await (prisma as any).note.createMany({
          data: DEFAULT_NOTES,
          skipDuplicates: true,
        });
      }
    }

    return user;
  } catch (error) {
    console.warn("[Prisma] getOrCreateLocalUser fallback activated:", error);
    return {
      id: LOCAL_USER_ID,
      email: LOCAL_USER_EMAIL,
      name: LOCAL_USER_NAME,
      contexts: DEFAULT_CONTEXTS,
    };
  }
}

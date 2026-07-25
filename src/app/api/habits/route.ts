import { prisma } from "@/lib/prisma";
import { LOCAL_USER_ID, getOrCreateLocalUser } from "@/lib/user";
import { calculateStreak, formatDateKey } from "@/lib/streak";
import { withErrorHandler, successResponse, errorResponse } from "@/lib/api-response";

const FALLBACK_HABITS = [
  {
    id: "habit-1",
    name: "Morning Meditation (10 mins)",
    streak: 1,
    completedToday: true,
    userId: LOCAL_USER_ID,
    logs: [{ id: "log-1", date: formatDateKey(new Date()), completed: true }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "habit-2",
    name: "Read 15 Pages of a Book",
    streak: 1,
    completedToday: true,
    userId: LOCAL_USER_ID,
    logs: [{ id: "log-2", date: formatDateKey(new Date()), completed: true }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "habit-3",
    name: "Workout",
    streak: 0,
    completedToday: false,
    userId: LOCAL_USER_ID,
    logs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const GET = withErrorHandler(async () => {
  if (!process.env.DATABASE_URL) {
    return successResponse(FALLBACK_HABITS);
  }

  try {
    await getOrCreateLocalUser();

    const habits = await prisma.habit.findMany({
      where: { userId: LOCAL_USER_ID },
      include: {
        logs: {
          orderBy: { date: "desc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const todayStr = formatDateKey(new Date());

    const result = habits.map((habit: { logs: { date: string; completed: boolean }[]; streak: number }) => {
      const computedStreak = calculateStreak(habit.logs);
      const completedToday = habit.logs.some(
        (log: { date: string; completed: boolean }) => formatDateKey(log.date) === todayStr && log.completed
      );

      return {
        ...habit,
        streak: computedStreak,
        completedToday,
      };
    });

    return successResponse(result.length > 0 ? result : FALLBACK_HABITS);
  } catch (error) {
    console.warn("[Prisma GET /api/habits fallback]:", error);
    return successResponse(FALLBACK_HABITS);
  }
});

export const POST = withErrorHandler(async (request: Request) => {
  const body = await request.json();
  const { name } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return errorResponse("Habit name is required", 400);
  }

  if (!process.env.DATABASE_URL) {
    const newHabit = {
      id: `habit-${Date.now()}`,
      name: name.trim(),
      streak: 0,
      completedToday: false,
      userId: LOCAL_USER_ID,
      logs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return successResponse(newHabit, 201);
  }

  try {
    await getOrCreateLocalUser();

    const habit = await prisma.habit.create({
      data: {
        name: name.trim(),
        streak: 0,
        userId: LOCAL_USER_ID,
      },
      include: {
        logs: true,
      },
    });

    return successResponse(
      {
        ...habit,
        streak: 0,
        completedToday: false,
      },
      201
    );
  } catch (error) {
    const newHabit = {
      id: `habit-${Date.now()}`,
      name: name.trim(),
      streak: 0,
      completedToday: false,
      userId: LOCAL_USER_ID,
      logs: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return successResponse(newHabit, 201);
  }
});

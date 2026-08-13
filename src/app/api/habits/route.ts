import { prisma, serverDb } from "@/lib/db";
import { getAuthenticatedUserId, seedUserDefaults } from "@/lib/auth";
import { calculateStreak, formatDateKey, withErrorHandler, successResponse, errorResponse } from "@/lib/utils";

export const GET = withErrorHandler(async () => {
  const userId = await getAuthenticatedUserId();
  if (!userId) return errorResponse("Unauthorized", 401);

  try {
    await seedUserDefaults(userId);

    const habits = await prisma.habit.findMany({
      where: { userId },
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

    return successResponse(result);
  } catch (error) {
    console.warn("[GET /api/habits] Error:", error);
    return successResponse(serverDb.getHabits());
  }
});

export const POST = withErrorHandler(async (request: Request) => {
  const userId = await getAuthenticatedUserId();
  if (!userId) return errorResponse("Unauthorized", 401);

  const body = await request.json();
  const { name } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return errorResponse("Habit name is required", 400);
  }

  try {
    const habit = await prisma.habit.create({
      data: {
        name: name.trim(),
        streak: 0,
        userId,
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
    return errorResponse("Failed to create habit", 500);
  }
});

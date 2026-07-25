/**
 * API Route: /api/habits
 * 
 * Handles listing and creating habits for the local user.
 * Wrapped in withErrorHandler for standardized JSON error handling.
 */

import { prisma } from "@/lib/prisma";
import { LOCAL_USER_ID, getOrCreateLocalUser } from "@/lib/user";
import { calculateStreak, formatDateKey } from "@/lib/streak";
import { withErrorHandler, successResponse, errorResponse } from "@/lib/api-response";

// ─── GET /api/habits ────────────────────────────────────────────────────────
export const GET = withErrorHandler(async () => {
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

  return successResponse(result);
});

// ─── POST /api/habits ───────────────────────────────────────────────────────
export const POST = withErrorHandler(async (request: Request) => {
  await getOrCreateLocalUser();

  const body = await request.json();
  const { name } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return errorResponse("Habit name is required", 400);
  }

  if (name.trim().length > 100) {
    return errorResponse("Habit name must be 100 characters or less", 400);
  }

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
});

/**
 * API Route: /api/habits/[id]/log
 * 
 * Handles logging or toggling habit completion for a specific date (default: today).
 * Recalculates consecutive streak and returns updated habit with all logs.
 * No authentication — ownership verified via LOCAL_USER_ID.
 * 
 * NEXT.JS 16: params is a Promise and must be awaited.
 */

import { prisma } from "@/lib/prisma";
import { LOCAL_USER_ID } from "@/lib/user";
import { calculateStreak, formatDateKey } from "@/lib/streak";

// ─── POST /api/habits/[id]/log ──────────────────────────────────────────────
// Body: { date?: string, completed?: boolean }
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { date, completed } = body;

    // Verify habit exists and belongs to local user
    const habit = await prisma.habit.findUnique({
      where: { id },
      include: { logs: true },
    });

    if (!habit || habit.userId !== LOCAL_USER_ID) {
      return Response.json({ error: "Habit not found" }, { status: 404 });
    }

    const targetDateStr = date ? formatDateKey(date) : formatDateKey(new Date());

    // Check if log already exists for this date
    const existingLog = habit.logs.find(
      (log: { date: string }) => formatDateKey(log.date) === targetDateStr
    );

    // Determine new completion status (toggle if completed not explicitly specified)
    const newCompleted =
      completed !== undefined ? Boolean(completed) : existingLog ? !existingLog.completed : true;

    if (existingLog) {
      await prisma.habitLog.update({
        where: { id: existingLog.id },
        data: { completed: newCompleted },
      });
    } else {
      await prisma.habitLog.create({
        data: {
          habitId: id,
          date: targetDateStr,
          completed: newCompleted,
        },
      });
    }

    // Fetch updated habit with logs to calculate new streak
    const updatedHabit = await prisma.habit.findUnique({
      where: { id },
      include: {
        logs: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (!updatedHabit) {
      return Response.json({ error: "Habit lost after log" }, { status: 500 });
    }

    const newStreak = calculateStreak(updatedHabit.logs);

    // Persist calculated streak
    const finalHabit = await prisma.habit.update({
      where: { id },
      data: { streak: newStreak },
      include: {
        logs: {
          orderBy: { date: "desc" },
        },
      },
    });

    const todayStr = formatDateKey(new Date());
    const completedToday = finalHabit.logs.some(
      (log: { date: string; completed: boolean }) => formatDateKey(log.date) === todayStr && log.completed
    );

    return Response.json({
      ...finalHabit,
      streak: newStreak,
      completedToday,
    });
  } catch (error) {
    console.error("[POST /api/habits/[id]/log] Error:", error);
    return Response.json(
      { error: "Failed to log habit" },
      { status: 500 }
    );
  }
}

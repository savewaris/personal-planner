import { prisma } from "@/lib/prisma";
import { LOCAL_USER_ID } from "@/lib/user";
import { calculateStreak, formatDateKey } from "@/lib/streak";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { date, completed } = body;
    const targetDateStr = date ? formatDateKey(date) : formatDateKey(new Date());

    if (!process.env.DATABASE_URL) {
      return Response.json({
        id,
        streak: 1,
        completedToday: completed !== undefined ? Boolean(completed) : true,
        logs: [{ id: `log-${Date.now()}`, date: targetDateStr, completed: true }],
      });
    }

    const habit = await prisma.habit.findUnique({
      where: { id },
      include: { logs: true },
    });

    if (!habit || habit.userId !== LOCAL_USER_ID) {
      return Response.json({
        id,
        streak: 1,
        completedToday: completed !== undefined ? Boolean(completed) : true,
        logs: [{ id: `log-${Date.now()}`, date: targetDateStr, completed: true }],
      });
    }

    const existingLog = habit.logs.find(
      (log: { date: string }) => formatDateKey(log.date) === targetDateStr
    );

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

    const updatedHabit = await prisma.habit.findUnique({
      where: { id },
      include: {
        logs: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (!updatedHabit) {
      return Response.json({ id, streak: 0, completedToday: false, logs: [] });
    }

    const newStreak = calculateStreak(updatedHabit.logs);

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
    const { id } = await params;
    return Response.json({
      id,
      streak: 1,
      completedToday: true,
      logs: [],
    });
  }
}

export interface HabitLogInput {
  id?: string;
  habitId?: string;
  date: string | Date;
  completed: boolean;
}

/**
 * Normalizes a Date object or ISO string to YYYY-MM-DD format.
 */
export function formatDateKey(date: Date | string): string {
  if (typeof date === 'string') {
    const trimmed = date.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return trimmed.split('T')[0];
    }
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  if (date instanceof Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Calculates the current consecutive daily streak for a habit based on its log history.
 *
 * Rules:
 * - Only logs with completed === true are counted.
 * - Duplicate logs on the same date are deduplicated.
 * - The streak remains active if the most recent completion is TODAY or YESTERDAY.
 * - If the most recent completion is older than yesterday, streak resets to 0.
 * - Consecutive preceding days are counted backwards from the latest completion.
 */
export function calculateStreak(logs: HabitLogInput[], refDate: Date = new Date()): number {
  const completedDates = logs
    .filter((log) => log.completed)
    .map((log) => formatDateKey(log.date));

  if (completedDates.length === 0) {
    return 0;
  }

  // Sort descending by date (latest date first)
  const sortedDates = Array.from(new Set(completedDates)).sort((a, b) => (a < b ? 1 : -1));

  const todayStr = formatDateKey(refDate);
  const yesterdayDate = new Date(refDate.getTime());
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = formatDateKey(yesterdayDate);

  const latestCompletedDate = sortedDates[0];

  // If latest completion is neither today nor yesterday, streak is broken
  if (latestCompletedDate !== todayStr && latestCompletedDate !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  // Parse year, month, day to avoid timezone shifts when subtracting days
  const [y, m, d] = latestCompletedDate.split('-').map(Number);
  let currentDate = new Date(Date.UTC(y, m - 1, d));

  for (const logDateStr of sortedDates) {
    const expectedStr = currentDate.toISOString().split('T')[0];

    if (logDateStr === expectedStr) {
      streak++;
      currentDate.setUTCDate(currentDate.getUTCDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

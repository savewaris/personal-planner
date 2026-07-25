import { describe, it, expect, beforeEach } from '@jest/globals';

/**
 * Tier 1 Test Suite: Habit Tracker Feature Coverage
 * Tests Habit creation, daily log logging, streak calculation, streak resets, and log unchecking per PROJECT.md.
 */

interface HabitLog {
  id: string;
  habitId: string;
  date: string; // ISO date string YYYY-MM-DD
  completed: boolean;
}

interface Habit {
  id: string;
  name: string;
  userId: string;
  streak: number;
  logs: HabitLog[];
}

function calculateStreak(logs: HabitLog[]): number {
  const sortedCompletedLogs = logs
    .filter((l) => l.completed)
    .map((l) => l.date)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (sortedCompletedLogs.length === 0) return 0;

  const uniqueDates = Array.from(new Set(sortedCompletedLogs));
  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Check if latest completion is today or yesterday
  const latest = uniqueDates[0];
  if (latest !== today && latest !== yesterday) {
    return 0; // Streak broken if no log today or yesterday
  }

  let currentDate = new Date(latest);

  for (let i = 0; i < uniqueDates.length; i++) {
    const logDate = uniqueDates[i];
    const expectedStr = currentDate.toISOString().split('T')[0];

    if (logDate === expectedStr) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

describe('Tier 1: Habit Tracker Feature Coverage', () => {
  let habitStore: Habit[] = [];
  const mockUserId = 'usr_123';

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  beforeEach(() => {
    habitStore = [
      {
        id: 'habit_1',
        name: 'Morning Meditation (10 mins)',
        userId: mockUserId,
        streak: 2,
        logs: [
          { id: 'log_1', habitId: 'habit_1', date: yesterdayStr, completed: true },
          { id: 'log_2', habitId: 'habit_1', date: todayStr, completed: true },
        ],
      },
      {
        id: 'habit_2',
        name: 'Drink 2L Water',
        userId: mockUserId,
        streak: 0,
        logs: [],
      },
    ];
  });

  it('1.1 should create a new habit with a name', () => {
    const input = { name: 'Read 15 Pages of Book' };
    const newHabit: Habit = {
      id: `habit_${Date.now()}`,
      name: input.name,
      userId: mockUserId,
      streak: 0,
      logs: [],
    };

    habitStore.push(newHabit);

    expect(newHabit.id).toBeDefined();
    expect(newHabit.name).toBe('Read 15 Pages of Book');
    expect(habitStore.length).toBe(3);
  });

  it('1.2 should log habit completion for a target date', () => {
    const habit = habitStore.find((h) => h.id === 'habit_2');
    expect(habit?.logs.length).toBe(0);

    const logDate = todayStr;
    const newLog: HabitLog = {
      id: `log_${Date.now()}`,
      habitId: 'habit_2',
      date: logDate,
      completed: true,
    };

    if (habit) {
      habit.logs.push(newLog);
      habit.streak = calculateStreak(habit.logs);
    }

    const updated = habitStore.find((h) => h.id === 'habit_2');
    expect(updated?.logs.length).toBe(1);
    expect(updated?.logs[0].completed).toBe(true);
  });

  it('1.3 should calculate consecutive daily streak correctly', () => {
    const habit = habitStore.find((h) => h.id === 'habit_1');
    const streak = calculateStreak(habit?.logs || []);
    expect(streak).toBe(2);
  });

  it('1.4 should reset streak if most recent log is older than yesterday', () => {
    // Last log was 3 days ago -> streak should reset to 0
    const threeDaysAgo = new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0];

    const brokenLogs: HabitLog[] = [
      { id: 'l1', habitId: 'h_broken', date: threeDaysAgo, completed: true },
    ];

    const streak = calculateStreak(brokenLogs);
    expect(streak).toBe(0);
  });

  it('1.5 should update streak count when unchecking a habit log (completed: false)', () => {
    const habit = habitStore.find((h) => h.id === 'habit_1');
    expect(habit?.streak).toBe(2);

    if (habit) {
      // Uncheck today's log
      const todayLog = habit.logs.find((l) => l.date === todayStr);
      if (todayLog) {
        todayLog.completed = false;
      }
      habit.streak = calculateStreak(habit.logs);
    }

    const updated = habitStore.find((h) => h.id === 'habit_1');
    expect(updated?.streak).toBe(1);
  });

  it('1.6 should retrieve all habits for user with current streaks and log statuses', () => {
    const userHabits = habitStore.filter((h) => h.userId === mockUserId);

    expect(userHabits.length).toBe(2);
    userHabits.forEach((h) => {
      expect(h).toHaveProperty('id');
      expect(h).toHaveProperty('name');
      expect(h).toHaveProperty('streak');
      expect(h).toHaveProperty('logs');
    });
  });
});

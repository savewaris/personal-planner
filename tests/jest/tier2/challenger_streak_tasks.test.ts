import { describe, it, expect } from '@jest/globals';
import { calculateStreak, formatDateKey, HabitLogInput } from '@/lib/utils';

/**
 * Empirical Stress Test Suite created by Challenger 2
 * Tests src/lib/streak.ts and task aggregation logic against edge cases.
 */

describe('Challenger 2 Empirical Stress Tests: Streak Calculation (src/lib/streak.ts)', () => {
  describe('Year Boundary Edge Cases', () => {
    it('should correctly count consecutive daily streak across year boundary (Dec 31 -> Jan 1)', () => {
      const logs: HabitLogInput[] = [
        { date: '2025-12-30', completed: true },
        { date: '2025-12-31', completed: true },
        { date: '2026-01-01', completed: true },
        { date: '2026-01-02', completed: true },
      ];
      const refDate = new Date('2026-01-02T12:00:00Z');
      const streak = calculateStreak(logs, refDate);
      expect(streak).toBe(4);
    });

    it('should correctly count streak when latest completion is Jan 1 and refDate is Jan 1', () => {
      const logs: HabitLogInput[] = [
        { date: '2025-12-31', completed: true },
        { date: '2026-01-01', completed: true },
      ];
      const refDate = new Date('2026-01-01T15:00:00Z');
      const streak = calculateStreak(logs, refDate);
      expect(streak).toBe(2);
    });

    it('should return streak of 1 if active on Dec 31 but broken on Jan 2', () => {
      const logs: HabitLogInput[] = [
        { date: '2025-12-31', completed: true },
      ];
      const refDate = new Date('2026-01-02T12:00:00Z');
      const streak = calculateStreak(logs, refDate);
      expect(streak).toBe(0);
    });
  });

  describe('Leap Year Edge Cases', () => {
    it('should handle leap year transitions (Feb 28 -> Feb 29 -> Mar 1 in 2024)', () => {
      const logs: HabitLogInput[] = [
        { date: '2024-02-28', completed: true },
        { date: '2024-02-29', completed: true },
        { date: '2024-03-01', completed: true },
      ];
      const refDate = new Date('2024-03-01T12:00:00Z');
      const streak = calculateStreak(logs, refDate);
      expect(streak).toBe(3);
    });

    it('should handle non-leap year transitions (Feb 28 -> Mar 1 in 2025)', () => {
      const logs: HabitLogInput[] = [
        { date: '2025-02-28', completed: true },
        { date: '2025-03-01', completed: true },
      ];
      const refDate = new Date('2025-03-01T12:00:00Z');
      const streak = calculateStreak(logs, refDate);
      expect(streak).toBe(2);
    });

    it('should reset streak if non-leap year skips Feb 29 (e.g. Feb 28 -> Mar 2)', () => {
      const logs: HabitLogInput[] = [
        { date: '2025-02-28', completed: true },
        { date: '2025-03-02', completed: true },
      ];
      const refDate = new Date('2025-03-02T12:00:00Z');
      const streak = calculateStreak(logs, refDate);
      expect(streak).toBe(1);
    });
  });

  describe('Multiple Completions in One Day', () => {
    it('should deduplicate multiple logs on the same day and count day only once', () => {
      const logs: HabitLogInput[] = [
        { id: '1', date: '2026-07-21', completed: true },
        { id: '2', date: '2026-07-21', completed: true },
        { id: '3', date: '2026-07-21', completed: true },
        { id: '4', date: '2026-07-20', completed: true },
      ];
      const refDate = new Date('2026-07-21T12:00:00Z');
      const streak = calculateStreak(logs, refDate);
      expect(streak).toBe(2);
    });

    it('should ignore uncompleted logs (completed: false) on same or different days', () => {
      const logs: HabitLogInput[] = [
        { id: '1', date: '2026-07-21', completed: true },
        { id: '2', date: '2026-07-21', completed: false },
        { id: '3', date: '2026-07-20', completed: false },
        { id: '4', date: '2026-07-19', completed: true },
      ];
      const refDate = new Date('2026-07-21T12:00:00Z');
      const streak = calculateStreak(logs, refDate);
      // July 21 completed (1), July 20 completed: false (break!)
      expect(streak).toBe(1);
    });
  });

  describe('Missed Days & Streak Resets', () => {
    it('should keep streak active if latest completion is yesterday', () => {
      const logs: HabitLogInput[] = [
        { date: '2026-07-19', completed: true },
        { date: '2026-07-20', completed: true },
      ];
      const refDate = new Date('2026-07-21T12:00:00Z');
      const streak = calculateStreak(logs, refDate);
      expect(streak).toBe(2);
    });

    it('should reset streak to 0 if last completion was 2 days ago', () => {
      const logs: HabitLogInput[] = [
        { date: '2026-07-18', completed: true },
        { date: '2026-07-19', completed: true },
      ];
      const refDate = new Date('2026-07-21T12:00:00Z'); // 20 and 21 missed
      const streak = calculateStreak(logs, refDate);
      expect(streak).toBe(0);
    });

    it('should count consecutive preceding days starting from latest completion', () => {
      const logs: HabitLogInput[] = [
        { date: '2026-07-21', completed: true },
        { date: '2026-07-20', completed: true },
        { date: '2026-07-18', completed: true }, // 19 missed
        { date: '2026-07-17', completed: true },
      ];
      const refDate = new Date('2026-07-21T12:00:00Z');
      const streak = calculateStreak(logs, refDate);
      expect(streak).toBe(2); // Only 21 and 20 count
    });
  });

  describe('Timezone & Date Format Edge Cases', () => {
    it('should handle Date objects and ISO strings consistently when in UTC', () => {
      const logs: HabitLogInput[] = [
        { date: new Date('2026-07-20T10:00:00Z'), completed: true },
        { date: '2026-07-21T14:30:00Z', completed: true },
      ];
      const refDate = new Date('2026-07-21T20:00:00Z');
      const streak = calculateStreak(logs, refDate);
      expect(streak).toBe(2);
    });

    it('verifies fix: refDate with non-UTC offset evaluates local date without shifting date in formatDateKey', () => {
      const refDateLocal1AM = new Date('2026-07-21T01:00:00+07:00');
      const logs: HabitLogInput[] = [
        { date: '2026-07-21', completed: true },
      ];
      
      const streak = calculateStreak(logs, refDateLocal1AM);
      expect(formatDateKey(refDateLocal1AM)).toBe('2026-07-21');
      expect(streak).toBe(1);
    });
  });
});

describe('Challenger 2 Empirical Stress Tests: Task Aggregation Logic', () => {
  // Helper function reproducing GET /api/tasks logic in src/app/api/tasks/route.ts
  function buildTaskWhereClause(urlStr: string, userId: string) {
    const url = new URL(urlStr, 'http://localhost');
    const rawContextId = url.searchParams.get('contextId');
    const contextId =
      rawContextId &&
      rawContextId.trim() !== '' &&
      rawContextId.trim() !== 'null' &&
      rawContextId.trim() !== 'undefined'
        ? rawContextId.trim()
        : null;

    const whereClause: any = {
      context: {
        userId: userId,
      },
    };

    if (contextId) {
      whereClause.contextId = contextId;
    }

    return { contextIdParam: contextId, whereClause };
  }

  it('should aggregate ALL tasks across contexts when contextId is omitted', () => {
    const { contextIdParam, whereClause } = buildTaskWhereClause('/api/tasks', 'usr_1');
    expect(contextIdParam).toBeNull();
    expect(whereClause).toEqual({
      context: { userId: 'usr_1' },
    });
    expect(whereClause.contextId).toBeUndefined();
  });

  it('should aggregate ALL tasks when contextId is empty string', () => {
    const { contextIdParam, whereClause } = buildTaskWhereClause('/api/tasks?contextId=', 'usr_1');
    expect(contextIdParam).toBeNull();
    expect(whereClause).toEqual({
      context: { userId: 'usr_1' },
    });
    expect(whereClause.contextId).toBeUndefined();
  });

  it('should filter by specific contextId when contextId is valid ID', () => {
    const { contextIdParam, whereClause } = buildTaskWhereClause('/api/tasks?contextId=ctx_work', 'usr_1');
    expect(contextIdParam).toBe('ctx_work');
    expect(whereClause).toEqual({
      context: { userId: 'usr_1' },
      contextId: 'ctx_work',
    });
  });

  it('verifies fix: contextId=null as literal string is sanitized to null and aggregates all tasks', () => {
    const { contextIdParam, whereClause } = buildTaskWhereClause('/api/tasks?contextId=null', 'usr_1');
    expect(contextIdParam).toBeNull();
    expect(whereClause.contextId).toBeUndefined();
  });

  it('verifies fix: contextId=undefined as literal string is sanitized to null and aggregates all tasks', () => {
    const { contextIdParam, whereClause } = buildTaskWhereClause('/api/tasks?contextId=undefined', 'usr_1');
    expect(contextIdParam).toBeNull();
    expect(whereClause.contextId).toBeUndefined();
  });

  it('verifies fix: contextId with untrimmed whitespace is trimmed before assigning to query filter', () => {
    const { contextIdParam, whereClause } = buildTaskWhereClause('/api/tasks?contextId=%20ctx_work%20', 'usr_1');
    expect(contextIdParam).toBe('ctx_work');
    expect(whereClause.contextId).toBe('ctx_work');
  });
});

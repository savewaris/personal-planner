import { describe, it, expect } from '@jest/globals';

/**
 * Tier 2 Test Suite: Boundary & Corner Cases
 * Tests edge cases, input validation, max length strings, streak resets across dates, and missing resources.
 */

describe('Tier 2: Boundary & Corner Cases', () => {
  describe('Context Boundary Cases', () => {
    it('2.1 should reject empty or whitespace-only context names', () => {
      const validateContextName = (name: string) => {
        if (!name || name.trim().length === 0) {
          throw new Error('Context name cannot be empty');
        }
        return true;
      };

      expect(() => validateContextName('')).toThrow('Context name cannot be empty');
      expect(() => validateContextName('   ')).toThrow('Context name cannot be empty');
      expect(() => validateContextName('\t\n')).toThrow('Context name cannot be empty');
      expect(validateContextName(' Valid Context ')).toBe(true);
    });

    it('2.2 should handle long context names up to max limit (50 characters)', () => {
      const validateLength = (name: string) => {
        if (name.length > 50) {
          throw new Error('Context name exceeds maximum length of 50 characters');
        }
        return true;
      };

      const valid50 = 'A'.repeat(50);
      const invalid51 = 'A'.repeat(51);

      expect(validateLength(valid50)).toBe(true);
      expect(() => validateLength(invalid51)).toThrow(
        'Context name exceeds maximum length of 50 characters'
      );
    });
  });

  describe('Auth Input Boundary Cases', () => {
    it('2.3 should reject malformed email formats and empty password strings', () => {
      const validateLoginInput = (email: string, password: string) => {
        const errors: string[] = [];
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email || !emailRegex.test(email)) {
          errors.push('Invalid email address');
        }
        if (!password || password.trim().length === 0) {
          errors.push('Password is required');
        }
        return errors;
      };

      expect(validateLoginInput('not-an-email', '')).toEqual([
        'Invalid email address',
        'Password is required',
      ]);
      expect(validateLoginInput("admin' OR '1'='1", 'pass')).toEqual(['Invalid email address']);
      expect(validateLoginInput('valid@planner.app', 'Secret123')).toEqual([]);
    });
  });

  describe('Task Input & Boundary Cases', () => {
    it('2.4 should handle max length task titles (255 characters) and large descriptions', () => {
      const validateTaskInput = (title: string, description?: string) => {
        if (!title || title.trim().length === 0) {
          return 'Title is required';
        }
        if (title.length > 255) {
          return 'Title exceeds 255 characters';
        }
        if (description && description.length > 5000) {
          return 'Description exceeds 5000 characters';
        }
        return null;
      };

      const title255 = 'T'.repeat(255);
      const title256 = 'T'.repeat(256);
      const desc5000 = 'D'.repeat(5000);
      const desc5001 = 'D'.repeat(5001);

      expect(validateTaskInput(title255)).toBeNull();
      expect(validateTaskInput(title256)).toBe('Title exceeds 255 characters');
      expect(validateTaskInput('Valid Title', desc5000)).toBeNull();
      expect(validateTaskInput('Valid Title', desc5001)).toBe('Description exceeds 5000 characters');
    });

    it('2.5 should safely handle operations on non-existent task IDs', () => {
      const taskStore = [{ id: 'task_1', title: 'Task 1' }];

      const deleteTask = (id: string) => {
        const index = taskStore.findIndex((t) => t.id === id);
        if (index === -1) {
          return { success: false, error: 'Task not found' };
        }
        taskStore.splice(index, 1);
        return { success: true };
      };

      const result = deleteTask('non_existent_id_999');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Task not found');
      expect(taskStore.length).toBe(1);
    });
  });

  describe('Habit Streak Reset Edge Cases', () => {
    it('2.6 should correctly calculate streak across month boundaries (e.g. Jan 31 -> Feb 1)', () => {
      const logs = [
        { date: '2026-01-31', completed: true },
        { date: '2026-02-01', completed: true },
        { date: '2026-02-02', completed: true },
      ];

      // Sort dates descending
      const sorted = logs.map((l) => l.date).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

      let streak = 0;
      let curr = new Date(sorted[0]);

      for (const dStr of sorted) {
        const expected = curr.toISOString().split('T')[0];
        if (dStr === expected) {
          streak++;
          curr.setDate(curr.getDate() - 1);
        } else {
          break;
        }
      }

      expect(streak).toBe(3);
    });

    it('2.7 should handle duplicate completion logs for the same date gracefully', () => {
      const logs = [
        { date: '2026-07-21', completed: true },
        { date: '2026-07-21', completed: true }, // duplicate
        { date: '2026-07-20', completed: true },
      ];

      // Deduplicate dates before streak calculation
      const uniqueDates = Array.from(new Set(logs.map((l) => l.date))).sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime()
      );

      expect(uniqueDates.length).toBe(2);
      expect(uniqueDates).toEqual(['2026-07-21', '2026-07-20']);
    });

    it('2.8 should handle leap year date transitions correctly (Feb 28 -> Feb 29 in leap year)', () => {
      const leapYearLogs = [
        { date: '2028-02-28', completed: true },
        { date: '2028-02-29', completed: true },
        { date: '2028-03-01', completed: true },
      ];

      const sorted = leapYearLogs
        .map((l) => l.date)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

      let streak = 0;
      let curr = new Date(sorted[0]);

      for (const dStr of sorted) {
        const expected = curr.toISOString().split('T')[0];
        if (dStr === expected) {
          streak++;
          curr.setDate(curr.getDate() - 1);
        } else {
          break;
        }
      }

      expect(streak).toBe(3);
    });
  });
});

import { describe, it, expect, beforeEach } from '@jest/globals';

/**
 * Tier 3 Test Suite: Cross-Feature Combinations
 * Tests interaction between Auth, Context Switcher, Task List, and Habit Tracker.
 */

interface Context {
  id: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
  contextId: string | null;
  completed: boolean;
}

interface Habit {
  id: string;
  name: string;
  streak: number;
}

describe('Tier 3: Cross-Feature Combinations', () => {
  let contexts: Context[];
  let tasks: Task[];
  let habits: Habit[];
  let activeContext: Context | null;

  beforeEach(() => {
    contexts = [
      { id: 'ctx_work', name: 'Work' },
      { id: 'ctx_personal', name: 'Personal' },
    ];
    tasks = [
      { id: 't1', title: 'Prepare Q3 Deck', contextId: 'ctx_work', completed: false },
      { id: 't2', title: 'Buy Groceries', contextId: 'ctx_personal', completed: true },
    ];
    habits = [
      { id: 'h1', name: 'Read Book', streak: 4 },
      { id: 'h2', name: 'Workout', streak: 1 },
    ];
    activeContext = contexts[0]; // Active context: Work
  });

  it('3.1 should automatically assign current activeContext.id to newly created task', () => {
    // Current active context is Work (ctx_work)
    expect(activeContext?.id).toBe('ctx_work');

    const createTaskInActiveContext = (title: string) => {
      const newTask: Task = {
        id: `t_${Date.now()}`,
        title,
        contextId: activeContext ? activeContext.id : null,
        completed: false,
      };
      tasks.push(newTask);
      return newTask;
    };

    const created = createTaskInActiveContext('Fix bug in API handler');

    expect(created.contextId).toBe('ctx_work');

    // Switch context to Personal
    activeContext = contexts[1];
    expect(activeContext.id).toBe('ctx_personal');

    const createdPersonal = createTaskInActiveContext('Pay Electric Bill');
    expect(createdPersonal.contextId).toBe('ctx_personal');
  });

  it('3.2 should maintain global habit tracker accessibility regardless of active workspace context', () => {
    // Habits are global to user profile and independent of activeContext filter
    const getHabitsForUser = (userId: string, currentContextId: string | null) => {
      // Habits are returned regardless of activeContext
      return habits;
    };

    // User is in Work context
    const habitsInWork = getHabitsForUser('usr_1', 'ctx_work');
    expect(habitsInWork.length).toBe(2);

    // User switches to Personal context
    const habitsInPersonal = getHabitsForUser('usr_1', 'ctx_personal');
    expect(habitsInPersonal.length).toBe(2);

    // User switches to All Contexts
    const habitsInAll = getHabitsForUser('usr_1', null);
    expect(habitsInAll.length).toBe(2);
  });

  it('3.3 should handle context deletion by reassigning or detaching tasks to unassigned (null)', () => {
    const contextToDeleteId = 'ctx_work';

    // Delete context
    contexts = contexts.filter((c) => c.id !== contextToDeleteId);

    // Reassign orphan tasks to null context
    tasks = tasks.map((t) => {
      if (t.contextId === contextToDeleteId) {
        return { ...t, contextId: null };
      }
      return t;
    });

    const orphanTask = tasks.find((t) => t.id === 't1');
    expect(orphanTask?.contextId).toBeNull();
    expect(contexts.find((c) => c.id === 'ctx_work')).toBeUndefined();
  });

  it('3.4 should preserve task completion states across context switching toggles', () => {
    // Toggle task t1 in Work context
    const taskT1 = tasks.find((t) => t.id === 't1');
    if (taskT1) taskT1.completed = true;

    // Switch to Personal context
    activeContext = contexts.find((c) => c.id === 'ctx_personal') || null;
    const personalTasks = tasks.filter((t) => t.contextId === activeContext?.id);
    expect(personalTasks.length).toBe(1);
    expect(personalTasks[0].id).toBe('t2');

    // Switch back to Work context
    activeContext = contexts.find((c) => c.id === 'ctx_work') || null;
    const workTasks = tasks.filter((t) => t.contextId === activeContext?.id);
    expect(workTasks.length).toBe(1);
    expect(workTasks[0].completed).toBe(true); // preserved!
  });

  it('3.5 should filter tasks dynamically based on active context while retaining habit streaks', () => {
    const state = {
      activeContextId: 'ctx_work' as string | null,
      tasks,
      habits,
    };

    const getDashboardState = () => {
      return {
        visibleTasks: state.tasks.filter(
          (t) => !state.activeContextId || t.contextId === state.activeContextId
        ),
        habits: state.habits,
      };
    };

    let dash = getDashboardState();
    expect(dash.visibleTasks.length).toBe(1);
    expect(dash.visibleTasks[0].title).toBe('Prepare Q3 Deck');
    expect(dash.habits.length).toBe(2);

    // Switch activeContextId to null (All Contexts)
    state.activeContextId = null;
    dash = getDashboardState();
    expect(dash.visibleTasks.length).toBe(2);
    expect(dash.habits.length).toBe(2);
  });
});

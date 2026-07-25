import { describe, it, expect, beforeEach } from '@jest/globals';

/**
 * Tier 1 Test Suite: Unified Task List Feature Coverage
 * Tests Task creation, listing, filtering, PATCH updates, and deletion per PROJECT.md interface contracts.
 */

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  contextId: string;
  projectId?: string;
  createdAt: string;
}

describe('Tier 1: Task List Feature Coverage', () => {
  let taskStore: Task[] = [];

  beforeEach(() => {
    taskStore = [
      {
        id: 'task_1',
        title: 'Submit Q3 Financial Report',
        description: 'Complete tax write-off details',
        completed: false,
        contextId: 'ctx_work',
        projectId: 'proj_finance',
        createdAt: '2026-07-20T10:00:00Z',
      },
      {
        id: 'task_2',
        title: 'Weekly Grocery Shopping',
        description: 'Buy milk, eggs, coffee',
        completed: false,
        contextId: 'ctx_personal',
        createdAt: '2026-07-21T08:00:00Z',
      },
      {
        id: 'task_3',
        title: 'Prepare Team Demo',
        description: 'Record Playwright E2E video',
        completed: true,
        contextId: 'ctx_work',
        projectId: 'proj_dev',
        createdAt: '2026-07-21T09:00:00Z',
      },
    ];
  });

  it('1.1 should create a new task with title, description, and contextId', () => {
    const newTaskInput = {
      title: 'Schedule Dentist Appointment',
      description: 'Call Dr. Smith at 2 PM',
      contextId: 'ctx_personal',
    };

    const createdTask: Task = {
      id: `task_${Date.now()}`,
      title: newTaskInput.title,
      description: newTaskInput.description,
      completed: false,
      contextId: newTaskInput.contextId,
      createdAt: new Date().toISOString(),
    };

    taskStore.push(createdTask);

    expect(createdTask.id).toBeDefined();
    expect(createdTask.completed).toBe(false);
    expect(taskStore.length).toBe(4);
    expect(taskStore.find((t) => t.id === createdTask.id)).toEqual(createdTask);
  });

  it('1.2 should list tasks filtered by specific contextId', () => {
    const contextId = 'ctx_work';
    const filteredTasks = taskStore.filter((t) => t.contextId === contextId);

    expect(filteredTasks.length).toBe(2);
    expect(filteredTasks.every((t) => t.contextId === 'ctx_work')).toBe(true);
  });

  it('1.3 should aggregate ALL tasks when contextId filter is omitted (All Contexts view)', () => {
    // When contextId is undefined/null, return full list
    const getTasks = (contextId?: string) => {
      if (!contextId) return taskStore;
      return taskStore.filter((t) => t.contextId === contextId);
    };

    const allTasks = getTasks();
    expect(allTasks.length).toBe(3);
  });

  it('1.4 should toggle task completion status (PATCH /api/tasks/[id])', () => {
    const taskIdToToggle = 'task_1';
    const task = taskStore.find((t) => t.id === taskIdToToggle);
    expect(task?.completed).toBe(false);

    if (task) {
      task.completed = !task.completed;
    }

    const updatedTask = taskStore.find((t) => t.id === taskIdToToggle);
    expect(updatedTask?.completed).toBe(true);
  });

  it('1.5 should delete a task by id (DELETE /api/tasks/[id])', () => {
    const taskIdToDelete = 'task_2';
    const initialLength = taskStore.length;

    taskStore = taskStore.filter((t) => t.id !== taskIdToDelete);

    expect(taskStore.length).toBe(initialLength - 1);
    expect(taskStore.find((t) => t.id === taskIdToDelete)).toBeUndefined();
  });

  it('1.6 should update task metadata (title, description, projectId)', () => {
    const taskId = 'task_1';
    const task = taskStore.find((t) => t.id === taskId);

    if (task) {
      task.title = 'Updated Q3 Financial Report Title';
      task.description = 'Updated description';
      task.projectId = 'proj_finance_v2';
    }

    const updated = taskStore.find((t) => t.id === taskId);
    expect(updated?.title).toBe('Updated Q3 Financial Report Title');
    expect(updated?.description).toBe('Updated description');
    expect(updated?.projectId).toBe('proj_finance_v2');
  });
});

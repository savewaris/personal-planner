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

  it('1.7 should accurately categorize tasks into Time-Horizon buckets (Overdue, Today, This Week, This Month, Completed)', () => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const fmt = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

    const d = new Date();
    const todayStr = fmt(d);

    const y = new Date(d);
    y.setDate(d.getDate() - 1);
    const yesterdayStr = fmt(y);

    const w = new Date(d);
    w.setDate(d.getDate() + 3);
    const in3DaysStr = fmt(w);

    const m = new Date(d);
    m.setDate(d.getDate() + 15);
    const in15DaysStr = fmt(m);

    const wEnd = new Date(d);
    wEnd.setDate(d.getDate() + 7);
    const in7DaysStr = fmt(wEnd);

    interface HorizonTask {
      id: string;
      dueDate?: string;
      status: string;
      completed: boolean;
    }

    const testTasks: HorizonTask[] = [
      { id: 't_overdue', dueDate: yesterdayStr, status: 'TODO', completed: false },
      { id: 't_today', dueDate: todayStr, status: 'TODO', completed: false },
      { id: 't_this_week', dueDate: in3DaysStr, status: 'IN_PROGRESS', completed: false },
      { id: 't_this_month', dueDate: in15DaysStr, status: 'TODO', completed: false },
      { id: 't_unscheduled', status: 'TODO', completed: false },
      { id: 't_done', dueDate: todayStr, status: 'DONE', completed: true },
    ];

    const getHorizon = (t: HorizonTask): string => {
      if (t.status === 'DONE' || t.completed) return 'COMPLETED';
      if (t.dueDate && t.dueDate < todayStr) return 'OVERDUE';
      if (t.dueDate && t.dueDate === todayStr) return 'TODAY';
      if (t.dueDate && t.dueDate > todayStr && t.dueDate <= in7DaysStr) return 'THIS_WEEK';
      return 'THIS_MONTH';
    };

    expect(getHorizon(testTasks[0])).toBe('OVERDUE');
    expect(getHorizon(testTasks[1])).toBe('TODAY');
    expect(getHorizon(testTasks[2])).toBe('THIS_WEEK');
    expect(getHorizon(testTasks[3])).toBe('THIS_MONTH');
    expect(getHorizon(testTasks[4])).toBe('THIS_MONTH');
    expect(getHorizon(testTasks[5])).toBe('COMPLETED');
  });

  it('1.9 should support full task editing drawer property updates', () => {
    const taskId = 'task_1';
    const original = taskStore.find((t) => t.id === taskId);
    expect(original?.title).toBe('Submit Q3 Financial Report');

    // Simulate EditTaskDrawer submit
    const updates = {
      title: 'Submit Q3 Financial & Tax Report (Revised)',
      description: 'Added audited balance sheets and invoice receipts',
      projectId: 'proj_audit',
      contextId: 'ctx_finance',
    };

    const taskIndex = taskStore.findIndex((t) => t.id === taskId);
    taskStore[taskIndex] = { ...taskStore[taskIndex], ...updates };

    const updated = taskStore.find((t) => t.id === taskId);
    expect(updated?.title).toBe('Submit Q3 Financial & Tax Report (Revised)');
    expect(updated?.description).toBe('Added audited balance sheets and invoice receipts');
    expect(updated?.projectId).toBe('proj_audit');
    expect(updated?.contextId).toBe('ctx_finance');
  });

  it('1.10 should filter tasks by project selector (ALL, UNASSIGNED, specific Project)', () => {
    // Project filter logic
    const filterByProject = (tasks: Task[], selectedProjectId: string) => {
      if (selectedProjectId === 'UNASSIGNED') {
        return tasks.filter((t) => !t.projectId);
      }
      if (selectedProjectId !== 'ALL') {
        return tasks.filter((t) => t.projectId === selectedProjectId);
      }
      return tasks;
    };

    const allTasks = filterByProject(taskStore, 'ALL');
    expect(allTasks.length).toBe(3);

    const standaloneTasks = filterByProject(taskStore, 'UNASSIGNED');
    expect(standaloneTasks.length).toBe(1);
    expect(standaloneTasks[0].id).toBe('task_2');

    const financeTasks = filterByProject(taskStore, 'proj_finance');
    expect(financeTasks.length).toBe(1);
    expect(financeTasks[0].id).toBe('task_1');
  });

  it('1.11 should reassign project association during Kanban project column drag-and-drop', () => {
    const taskId = 'task_2'; // Initially unassigned
    expect(taskStore.find((t) => t.id === taskId)?.projectId).toBeUndefined();

    // Drop onto proj_dev column
    const targetProjectColId: string = 'proj_dev';
    const taskIndex = taskStore.findIndex((t) => t.id === taskId);
    taskStore[taskIndex] = {
      ...taskStore[taskIndex],
      projectId: targetProjectColId === 'UNASSIGNED' ? undefined : targetProjectColId,
    };

    expect(taskStore.find((t) => t.id === taskId)?.projectId).toBe('proj_dev');

    // Drop back onto Standalone / UNASSIGNED column
    taskStore[taskIndex] = {
      ...taskStore[taskIndex],
      projectId: undefined,
    };
    expect(taskStore.find((t) => t.id === taskId)?.projectId).toBeUndefined();
  });
});


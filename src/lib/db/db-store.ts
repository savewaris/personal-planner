/**
 * Unified Database & Server Memory Store — Cross-Device Synchronization
 *
 * Ensures that changes made on one device (e.g. Desktop Computer) are immediately
 * visible on all other devices (e.g. iPhone / Mobile Safari).
 *
 * Operations mutate a shared global server store on Vercel so GET /api/* returns
 * synchronized data to all devices.
 */

import { TaskItem } from "@/components/tasks";
import { HabitItem, WorkspaceContextItem, NoteItem } from "@/services/api";

// Default Initial Contexts
const DEFAULT_CONTEXTS: WorkspaceContextItem[] = [
  { id: "ctx-personal", name: "Personal", color: "blue", userId: "local" },
  { id: "ctx-work", name: "Work", color: "emerald", userId: "local" },
  { id: "ctx-freelance", name: "Freelance", color: "purple", userId: "local" },
];

// Default Initial Notes
const DEFAULT_NOTES: NoteItem[] = [
  {
    id: "note-1",
    content: "Ideas for UI polish: add dark glass card micro-animations and quick action drawer",
    createdAt: new Date().toISOString(),
  },
  {
    id: "note-2",
    content: "Buy noise-canceling headphones for deep focus work sessions",
    createdAt: new Date().toISOString(),
  },
];

// Default Initial Tasks
const DEFAULT_TASKS: TaskItem[] = [
  {
    id: "task-1",
    title: "Review Q3 client project deliverables",
    description: "Audit milestone progress and draft status report.",
    completed: true,
    status: "DONE",
    priority: "MEDIUM",
    tags: JSON.stringify(["freelance", "review"]),
    subtasks: null,
    contextId: "ctx-freelance",
    createdAt: new Date().toISOString(),
  },
  {
    id: "task-2",
    title: "Finish API route handler implementation",
    description: "Ensure Next.js 16 awaited params pattern across all route files.",
    completed: true,
    status: "DONE",
    priority: "HIGH",
    tags: JSON.stringify(["dev", "backend"]),
    subtasks: null,
    contextId: "ctx-work",
    createdAt: new Date().toISOString(),
  },
  {
    id: "task-3",
    title: "Morning 30-min walk & stretch",
    description: "Get sunlight and fresh air before starting deep work.",
    completed: true,
    status: "DONE",
    priority: "MEDIUM",
    tags: JSON.stringify(["health"]),
    subtasks: null,
    contextId: "ctx-personal",
    createdAt: new Date().toISOString(),
  },
];

// Default Initial Habits
const DEFAULT_HABITS: HabitItem[] = [
  {
    id: "habit-1",
    name: "Morning Meditation (10 mins)",
    streak: 1,
    completedToday: true,
    logs: [{ id: "log-1", date: new Date().toISOString().split("T")[0], completed: true }],
  },
  {
    id: "habit-2",
    name: "Read 15 Pages of a Book",
    streak: 1,
    completedToday: true,
    logs: [{ id: "log-2", date: new Date().toISOString().split("T")[0], completed: true }],
  },
  {
    id: "habit-3",
    name: "Workout",
    streak: 0,
    completedToday: false,
    logs: [],
  },
];

// Global Server Store for Cross-Device Persistence
const globalStore = globalThis as unknown as {
  serverTasks: TaskItem[] | undefined;
  serverHabits: HabitItem[] | undefined;
  serverContexts: WorkspaceContextItem[] | undefined;
  serverNotes: NoteItem[] | undefined;
  deletedTaskIds: Set<string> | undefined;
  deletedHabitIds: Set<string> | undefined;
  deletedContextIds: Set<string> | undefined;
  deletedNoteIds: Set<string> | undefined;
};

if (!globalStore.serverTasks) globalStore.serverTasks = [...DEFAULT_TASKS];
if (!globalStore.serverHabits) globalStore.serverHabits = [...DEFAULT_HABITS];
if (!globalStore.serverContexts) globalStore.serverContexts = [...DEFAULT_CONTEXTS];
if (!globalStore.serverNotes) globalStore.serverNotes = [...DEFAULT_NOTES];
if (!globalStore.deletedTaskIds) globalStore.deletedTaskIds = new Set<string>();
if (!globalStore.deletedHabitIds) globalStore.deletedHabitIds = new Set<string>();
if (!globalStore.deletedContextIds) globalStore.deletedContextIds = new Set<string>();
if (!globalStore.deletedNoteIds) globalStore.deletedNoteIds = new Set<string>();

export const serverDb = {
  // Notes
  getNotes: () => {
    return (globalStore.serverNotes || []).filter(
      (n) => !globalStore.deletedNoteIds?.has(n.id)
    );
  },

  addNote: (note: NoteItem) => {
    globalStore.serverNotes = [note, ...(globalStore.serverNotes || [])];
    return note;
  },

  updateNote: (id: string, updates: Partial<NoteItem>) => {
    globalStore.serverNotes = (globalStore.serverNotes || []).map((n) =>
      n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
    );
    return globalStore.serverNotes.find((n) => n.id === id);
  },

  deleteNote: (id: string) => {
    globalStore.deletedNoteIds?.add(id);
    globalStore.serverNotes = (globalStore.serverNotes || []).filter((n) => n.id !== id);
    return true;
  },

  // Tasks
  getTasks: (contextId?: string, status?: string, search?: string) => {
    let list = (globalStore.serverTasks || []).filter(
      (t) => !globalStore.deletedTaskIds?.has(t.id)
    );
    if (contextId) list = list.filter((t) => t.contextId === contextId);
    if (status) list = list.filter((t) => t.status === status);
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (t) => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q))
      );
    }
    return list;
  },

  addTask: (task: TaskItem) => {
    globalStore.serverTasks = [task, ...(globalStore.serverTasks || [])];
    return task;
  },

  updateTask: (id: string, updates: Partial<TaskItem>) => {
    globalStore.serverTasks = (globalStore.serverTasks || []).map((t) =>
      t.id === id ? { ...t, ...updates } : t
    );
    return globalStore.serverTasks.find((t) => t.id === id);
  },

  deleteTask: (id: string) => {
    globalStore.deletedTaskIds?.add(id);
    globalStore.serverTasks = (globalStore.serverTasks || []).filter((t) => t.id !== id);
    return true;
  },

  // Habits
  getHabits: () => {
    return (globalStore.serverHabits || []).filter(
      (h) => !globalStore.deletedHabitIds?.has(h.id)
    );
  },

  addHabit: (habit: HabitItem) => {
    globalStore.serverHabits = [...(globalStore.serverHabits || []), habit];
    return habit;
  },

  updateHabit: (id: string, updates: Partial<HabitItem>) => {
    globalStore.serverHabits = (globalStore.serverHabits || []).map((h) =>
      h.id === id ? { ...h, ...updates } : h
    );
    return globalStore.serverHabits.find((h) => h.id === id);
  },

  deleteHabit: (id: string) => {
    globalStore.deletedHabitIds?.add(id);
    globalStore.serverHabits = (globalStore.serverHabits || []).filter((h) => h.id !== id);
    return true;
  },

  // Contexts
  getContexts: () => {
    return (globalStore.serverContexts || []).filter(
      (c) => !globalStore.deletedContextIds?.has(c.id)
    );
  },

  addContext: (context: WorkspaceContextItem) => {
    globalStore.serverContexts = [...(globalStore.serverContexts || []), context];
    return context;
  },

  deleteContext: (id: string) => {
    globalStore.deletedContextIds?.add(id);
    globalStore.serverContexts = (globalStore.serverContexts || []).filter((c) => c.id !== id);
    return true;
  },
};

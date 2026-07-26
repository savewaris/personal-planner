"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { api, HabitItem, WorkspaceContextItem, NoteItem } from "@/services/api";
import { TaskItem } from "@/components/TaskCard";

interface PlannerStoreContextType {
  tasks: TaskItem[];
  habits: HabitItem[];
  contexts: WorkspaceContextItem[];
  notes: NoteItem[];
  activeContextId: string | null;
  setActiveContextId: (id: string | null) => void;
  isLoading: boolean;
  refetchAll: () => Promise<void>;

  // Task Mutations
  createTask: (data: Parameters<typeof api.tasks.create>[0]) => Promise<TaskItem>;
  updateTaskStatus: (taskId: string, newStatus: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;

  // Habit Mutations
  createHabit: (name: string) => Promise<HabitItem>;
  toggleHabit: (habitId: string) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;

  // Note Mutations
  createNote: (content: string, contextId?: string) => Promise<NoteItem>;
  deleteNote: (noteId: string) => Promise<void>;
  convertNoteToTask: (noteId: string, taskData: Parameters<typeof api.tasks.create>[0]) => Promise<void>;
  convertNoteToHabit: (noteId: string, habitName: string) => Promise<void>;

  // Context Mutations
  createContext: (name: string, color?: string) => Promise<WorkspaceContextItem>;
  deleteContext: (contextId: string) => Promise<void>;

  // Computed Stats
  stats: {
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    activeHabits: number;
    maxStreak: number;
    pendingNotes: number;
  };
}

const PlannerStoreContext = createContext<PlannerStoreContextType | undefined>(undefined);

export const PlannerStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [contexts, setContexts] = useState<WorkspaceContextItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [activeContextId, setActiveContextIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Local Storage Persistence Keys
  const DELETED_TASKS_KEY = "planner_deleted_task_ids";
  const DELETED_HABITS_KEY = "planner_deleted_habit_ids";
  const DELETED_NOTES_KEY = "planner_deleted_note_ids";
  const CUSTOM_TASKS_KEY = "planner_custom_tasks";
  const CUSTOM_HABITS_KEY = "planner_custom_habits";
  const CUSTOM_NOTES_KEY = "planner_custom_notes";

  const getDeletedIds = (key: string): string[] => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const addDeletedId = (key: string, id: string) => {
    try {
      const current = getDeletedIds(key);
      if (!current.includes(id)) {
        localStorage.setItem(key, JSON.stringify([...current, id]));
      }
    } catch {
      // ignore
    }
  };

  const getCustomItems = <T,>(key: string): T[] => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const saveCustomItem = <T extends { id: string }>(key: string, item: T) => {
    try {
      const current = getCustomItems<T>(key);
      const updated = [item, ...current.filter((i) => i.id !== item.id)];
      localStorage.setItem(key, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Load saved activeContextId from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("planner_active_context_id");
      if (saved) setActiveContextIdState(saved);
    } catch {
      // ignore
    }
  }, []);

  const setActiveContextId = useCallback((id: string | null) => {
    setActiveContextIdState(id);
    try {
      if (id) {
        localStorage.setItem("planner_active_context_id", id);
      } else {
        localStorage.removeItem("planner_active_context_id");
      }
    } catch {
      // ignore
    }
  }, []);

  // Central Refetch Function
  const refetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tasksData, habitsData, contextsData, notesData] = await Promise.all([
        api.tasks.getAll({ contextId: activeContextId || undefined }),
        api.habits.getAll(),
        api.contexts.getAll(),
        api.notes.getAll(),
      ]);

      const deletedTaskIds = getDeletedIds(DELETED_TASKS_KEY);
      const deletedHabitIds = getDeletedIds(DELETED_HABITS_KEY);
      const deletedNoteIds = getDeletedIds(DELETED_NOTES_KEY);

      const customTasks = getCustomItems<TaskItem>(CUSTOM_TASKS_KEY);
      const customHabits = getCustomItems<HabitItem>(CUSTOM_HABITS_KEY);
      const customNotes = getCustomItems<NoteItem>(CUSTOM_NOTES_KEY);

      // Tasks combine
      const combinedTasksMap = new Map<string, TaskItem>();
      tasksData.forEach((t) => combinedTasksMap.set(t.id, t));
      customTasks.forEach((t) => combinedTasksMap.set(t.id, t));
      const filteredTasks = Array.from(combinedTasksMap.values()).filter((t) => !deletedTaskIds.includes(t.id));

      // Habits combine
      const combinedHabitsMap = new Map<string, HabitItem>();
      habitsData.forEach((h) => combinedHabitsMap.set(h.id, h));
      customHabits.forEach((h) => combinedHabitsMap.set(h.id, h));
      const filteredHabits = Array.from(combinedHabitsMap.values()).filter((h) => !deletedHabitIds.includes(h.id));

      // Notes combine
      const combinedNotesMap = new Map<string, NoteItem>();
      notesData.forEach((n) => combinedNotesMap.set(n.id, n));
      customNotes.forEach((n) => combinedNotesMap.set(n.id, n));
      const filteredNotes = Array.from(combinedNotesMap.values()).filter((n) => !deletedNoteIds.includes(n.id));

      setTasks(filteredTasks);
      setHabits(filteredHabits);
      setContexts(contextsData);
      setNotes(filteredNotes);
    } catch (err) {
      console.error("[PlannerStore] Refetch failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeContextId]);

  useEffect(() => {
    refetchAll();
  }, [refetchAll]);

  // ─── Task Mutations ───────────────────────────────────────────────────────
  const createTask = async (data: Parameters<typeof api.tasks.create>[0]) => {
    const created = await api.tasks.create(data);
    saveCustomItem<TaskItem>(CUSTOM_TASKS_KEY, created);
    await refetchAll();
    return created;
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updated = { ...t, status: newStatus, completed: newStatus === "DONE" };
          saveCustomItem<TaskItem>(CUSTOM_TASKS_KEY, updated);
          return updated;
        }
        return t;
      })
    );
    try {
      await api.tasks.update(taskId, { status: newStatus });
    } catch (err) {
      console.error("[PlannerStore] Update task failed:", err);
    }
  };

  const deleteTask = async (taskId: string) => {
    addDeletedId(DELETED_TASKS_KEY, taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await api.tasks.delete(taskId);
    } catch (err) {
      console.error("[PlannerStore] Delete task error:", err);
    }
  };

  // ─── Habit Mutations ──────────────────────────────────────────────────────
  const createHabit = async (name: string) => {
    const created = await api.habits.create({ name });
    saveCustomItem<HabitItem>(CUSTOM_HABITS_KEY, created);
    await refetchAll();
    return created;
  };

  const toggleHabit = async (habitId: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === habitId) {
          const nextCompleted = !h.completedToday;
          const nextStreak = nextCompleted ? h.streak + 1 : Math.max(0, h.streak - 1);
          const updated = { ...h, completedToday: nextCompleted, streak: nextStreak };
          saveCustomItem<HabitItem>(CUSTOM_HABITS_KEY, updated);
          return updated;
        }
        return h;
      })
    );

    try {
      await api.habits.toggleLog(habitId);
    } catch (err) {
      console.error("[PlannerStore] Toggle habit error:", err);
    }
  };

  const deleteHabit = async (habitId: string) => {
    addDeletedId(DELETED_HABITS_KEY, habitId);
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    try {
      await api.habits.delete(habitId);
    } catch (err) {
      console.error("[PlannerStore] Delete habit error:", err);
    }
  };

  // ─── Note Mutations ───────────────────────────────────────────────────────
  const createNote = async (content: string, contextId?: string) => {
    const created = await api.notes.create({ content, contextId });
    saveCustomItem<NoteItem>(CUSTOM_NOTES_KEY, created);
    await refetchAll();
    return created;
  };

  const deleteNote = async (noteId: string) => {
    addDeletedId(DELETED_NOTES_KEY, noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    try {
      await api.notes.delete(noteId);
    } catch (err) {
      console.error("[PlannerStore] Delete note error:", err);
    }
  };

  const convertNoteToTask = async (noteId: string, taskData: Parameters<typeof api.tasks.create>[0]) => {
    // 1. Create the new task
    await createTask(taskData);
    // 2. Delete the converted note
    await deleteNote(noteId);
  };

  const convertNoteToHabit = async (noteId: string, habitName: string) => {
    // 1. Create the new habit
    await createHabit(habitName);
    // 2. Delete the converted note
    await deleteNote(noteId);
  };

  // ─── Context Mutations ────────────────────────────────────────────────────
  const createContext = async (name: string, color?: string) => {
    const created = await api.contexts.create({ name, color });
    await refetchAll();
    return created;
  };

  const deleteContext = async (contextId: string) => {
    setContexts((prev) => prev.filter((c) => c.id !== contextId));
    if (activeContextId === contextId) setActiveContextId(null);
    try {
      await api.contexts.delete(contextId);
      await refetchAll();
    } catch (err) {
      console.error("[PlannerStore] Delete context failed:", err);
    }
  };

  // ─── Computed Stats ───────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "DONE" || t.completed).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const activeHabits = habits.length;
    const maxStreak = habits.length > 0 ? Math.max(...habits.map((h) => h.streak || 0)) : 0;
    const pendingNotes = notes.length;

    return {
      totalTasks,
      completedTasks,
      completionRate,
      activeHabits,
      maxStreak,
      pendingNotes,
    };
  }, [tasks, habits, notes]);

  return (
    <PlannerStoreContext.Provider
      value={{
        tasks,
        habits,
        contexts,
        notes,
        activeContextId,
        setActiveContextId,
        isLoading,
        refetchAll,
        createTask,
        updateTaskStatus,
        deleteTask,
        createHabit,
        toggleHabit,
        deleteHabit,
        createNote,
        deleteNote,
        convertNoteToTask,
        convertNoteToHabit,
        createContext,
        deleteContext,
        stats,
      }}
    >
      {children}
    </PlannerStoreContext.Provider>
  );
};

export const usePlannerStore = () => {
  const context = useContext(PlannerStoreContext);
  if (!context) {
    throw new Error("usePlannerStore must be used within a PlannerStoreProvider");
  }
  return context;
};

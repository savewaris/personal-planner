"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { api, HabitItem, WorkspaceContextItem, NoteItem, RoutineItem } from "@/services/api";
import { TaskItem } from "@/components/TaskCard";

interface PlannerStoreContextType {
  tasks: TaskItem[];
  routines: RoutineItem[];
  habits: HabitItem[];
  contexts: WorkspaceContextItem[];
  notes: NoteItem[];
  activeContextId: string | null;
  setActiveContextId: (id: string | null) => void;
  isLoading: boolean;
  refetchAll: () => Promise<void>;

  // Task Mutations
  createTask: (data: Parameters<typeof api.tasks.create>[0]) => Promise<TaskItem>;
  updateTask: (taskId: string, updates: { title?: string; priority?: string; tags?: string[] | string | null }) => Promise<void>;
  updateTaskStatus: (taskId: string, newStatus: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;

  // Routine Mutations
  createRoutine: (data: { title: string; dayKey: string; tags?: string[] }) => Promise<RoutineItem>;
  updateRoutine: (routineId: string, updates: { title?: string; dayKey?: string; tags?: string[] | string | null }) => Promise<void>;
  toggleRoutine: (routineId: string) => Promise<void>;
  deleteRoutine: (routineId: string) => Promise<void>;

  // Habit Mutations
  createHabit: (name: string) => Promise<HabitItem>;
  updateHabit: (habitId: string, updates: { name: string }) => Promise<void>;
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
  const [routines, setRoutines] = useState<RoutineItem[]>([]);
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [contexts, setContexts] = useState<WorkspaceContextItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [activeContextId, setActiveContextIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Local Storage Persistence Keys
  const DELETED_TASKS_KEY = "planner_deleted_task_ids";
  const DELETED_ROUTINES_KEY = "planner_deleted_routine_ids";
  const DELETED_HABITS_KEY = "planner_deleted_habit_ids";
  const DELETED_NOTES_KEY = "planner_deleted_note_ids";
  const CUSTOM_TASKS_KEY = "planner_custom_tasks";
  const CUSTOM_ROUTINES_KEY = "planner_custom_routines";
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

  // Replaces or removes a temporary item ID from localStorage when DB creation finishes
  const replaceCustomItem = <T extends { id: string }>(key: string, oldId: string, newItem: T) => {
    try {
      const current = getCustomItems<T>(key);
      const updated = [newItem, ...current.filter((i) => i.id !== oldId && i.id !== newItem.id)];
      localStorage.setItem(key, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Removes a temporary item ID from localStorage
  const removeCustomItem = (key: string, id: string) => {
    try {
      const current = getCustomItems<{ id: string }>(key);
      const updated = current.filter((i) => i.id !== id);
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

  // Central Refetch Function with Duplication Cleanup
  const refetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tasksData, routinesData, habitsData, contextsData, notesData] = await Promise.all([
        api.tasks.getAll({ contextId: activeContextId || undefined }).catch(() => []),
        api.routines.getAll().catch(() => []),
        api.habits.getAll().catch(() => []),
        api.contexts.getAll().catch(() => []),
        api.notes.getAll().catch(() => []),
      ]);

      const deletedTaskIds = getDeletedIds(DELETED_TASKS_KEY);
      const deletedRoutineIds = getDeletedIds(DELETED_ROUTINES_KEY);
      const deletedHabitIds = getDeletedIds(DELETED_HABITS_KEY);
      const deletedNoteIds = getDeletedIds(DELETED_NOTES_KEY);

      const customTasks = getCustomItems<TaskItem>(CUSTOM_TASKS_KEY);
      const customRoutines = getCustomItems<RoutineItem>(CUSTOM_ROUTINES_KEY);
      const customHabits = getCustomItems<HabitItem>(CUSTOM_HABITS_KEY);
      const customNotes = getCustomItems<NoteItem>(CUSTOM_NOTES_KEY);

      // Clean out temp-* entries from custom items if real DB items match
      const cleanCustomTasks = customTasks.filter((ct) => {
        if (ct.id.startsWith("temp-")) {
          // If a real task from API has matching title, purge temp entry from localStorage
          if (tasksData.some((dt) => dt.title.trim().toLowerCase() === ct.title.trim().toLowerCase())) {
            removeCustomItem(CUSTOM_TASKS_KEY, ct.id);
            return false;
          }
        }
        return true;
      });

      const cleanCustomRoutines = customRoutines.filter((cr) => {
        if (cr.id.startsWith("temp-")) {
          if (routinesData.some((dr) => dr.title.trim().toLowerCase() === cr.title.trim().toLowerCase())) {
            removeCustomItem(CUSTOM_ROUTINES_KEY, cr.id);
            return false;
          }
        }
        return true;
      });

      const cleanCustomHabits = customHabits.filter((ch) => {
        if (ch.id.startsWith("temp-")) {
          if (habitsData.some((dh) => dh.name.trim().toLowerCase() === ch.name.trim().toLowerCase())) {
            removeCustomItem(CUSTOM_HABITS_KEY, ch.id);
            return false;
          }
        }
        return true;
      });

      // Tasks combine: API tasks take precedence
      const combinedTasksMap = new Map<string, TaskItem>();
      cleanCustomTasks.forEach((t) => combinedTasksMap.set(t.id, t));
      tasksData.forEach((t) => combinedTasksMap.set(t.id, t));
      const filteredTasks = Array.from(combinedTasksMap.values()).filter((t) => !deletedTaskIds.includes(t.id));

      // Routines combine: API routines take precedence
      const combinedRoutinesMap = new Map<string, RoutineItem>();
      cleanCustomRoutines.forEach((r) => combinedRoutinesMap.set(r.id, r));
      routinesData.forEach((r) => combinedRoutinesMap.set(r.id, r));
      const filteredRoutines = Array.from(combinedRoutinesMap.values()).filter((r) => !deletedRoutineIds.includes(r.id));

      // Habits combine: API habits take precedence
      const combinedHabitsMap = new Map<string, HabitItem>();
      cleanCustomHabits.forEach((h) => combinedHabitsMap.set(h.id, h));
      habitsData.forEach((h) => combinedHabitsMap.set(h.id, h));
      const filteredHabits = Array.from(combinedHabitsMap.values()).filter((h) => !deletedHabitIds.includes(h.id));

      // Notes combine: API notes take precedence
      const combinedNotesMap = new Map<string, NoteItem>();
      customNotes.forEach((n) => combinedNotesMap.set(n.id, n));
      notesData.forEach((n) => combinedNotesMap.set(n.id, n));
      const filteredNotes = Array.from(combinedNotesMap.values()).filter((n) => !deletedNoteIds.includes(n.id));

      setTasks(filteredTasks);
      setRoutines(filteredRoutines);
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

  // ─── Instant 0ms Optimistic Task Mutations ─────────────────────────────────
  const createTask = async (data: Parameters<typeof api.tasks.create>[0]) => {
    const tempId = `temp-task-${Date.now()}`;
    const tempTask: TaskItem = {
      id: tempId,
      title: data.title,
      description: data.description,
      status: data.status || "TODO",
      priority: data.priority || "MEDIUM",
      dueDate: data.dueDate,
      tags: data.tags ? (typeof data.tags === "string" ? data.tags : JSON.stringify(data.tags)) : null,
      contextId: data.contextId || activeContextId || "",
      completed: false,
    };

    // Instant 0ms UI update
    setTasks((prev) => [tempTask, ...prev]);
    saveCustomItem<TaskItem>(CUSTOM_TASKS_KEY, tempTask);

    try {
      const created = await api.tasks.create(data);
      setTasks((prev) => prev.map((t) => (t.id === tempId ? created : t)));
      replaceCustomItem<TaskItem>(CUSTOM_TASKS_KEY, tempId, created);
      return created;
    } catch (err) {
      console.warn("[PlannerStore] Background task create synced via local mode");
      return tempTask;
    }
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

  const updateTask = async (taskId: string, updates: { title?: string; priority?: string; tags?: string[] | string | null }) => {
    const formattedUpdates = {
      ...updates,
      tags: updates.tags ? (typeof updates.tags === "string" ? updates.tags : JSON.stringify(updates.tags)) : null,
    };
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updated = { ...t, ...formattedUpdates };
          saveCustomItem<TaskItem>(CUSTOM_TASKS_KEY, updated);
          return updated;
        }
        return t;
      })
    );
    try {
      await api.tasks.update(taskId, updates as any);
    } catch (err) {
      console.error("[PlannerStore] updateTask error:", err);
    }
  };

  const deleteTask = async (taskId: string) => {
    addDeletedId(DELETED_TASKS_KEY, taskId);
    removeCustomItem(CUSTOM_TASKS_KEY, taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await api.tasks.delete(taskId);
    } catch (err) {
      console.error("[PlannerStore] Delete task error:", err);
    }
  };

  // ─── Instant 0ms Optimistic Routine Mutations ──────────────────────────────
  const createRoutine = async (data: { title: string; dayKey: string; tags?: string[] }) => {
    const tempId = `temp-routine-${Date.now()}`;
    const tempRoutine: RoutineItem = {
      id: tempId,
      title: data.title,
      dayKey: data.dayKey,
      completed: false,
      tags: data.tags ? JSON.stringify(data.tags) : null,
    };

    // Instant 0ms UI update
    setRoutines((prev) => [tempRoutine, ...prev]);
    saveCustomItem<RoutineItem>(CUSTOM_ROUTINES_KEY, tempRoutine);

    try {
      const created = await api.routines.create(data);
      setRoutines((prev) => prev.map((r) => (r.id === tempId ? created : r)));
      replaceCustomItem<RoutineItem>(CUSTOM_ROUTINES_KEY, tempId, created);
      return created;
    } catch (err) {
      console.warn("[PlannerStore] Background routine create synced via local mode");
      return tempRoutine;
    }
  };

  const toggleRoutine = async (routineId: string) => {
    setRoutines((prev) =>
      prev.map((r) => {
        if (r.id === routineId) {
          const updated = { ...r, completed: !r.completed };
          saveCustomItem<RoutineItem>(CUSTOM_ROUTINES_KEY, updated);
          return updated;
        }
        return r;
      })
    );
    try {
      const routine = routines.find((r) => r.id === routineId);
      if (routine) {
        await api.routines.update(routineId, { completed: !routine.completed });
      }
    } catch (err) {
      console.error("[PlannerStore] Toggle routine error:", err);
    }
  };

  const updateRoutine = async (routineId: string, updates: { title?: string; dayKey?: string; tags?: string[] | string | null }) => {
    const formattedUpdates = {
      ...updates,
      tags: updates.tags ? (typeof updates.tags === "string" ? updates.tags : JSON.stringify(updates.tags)) : null,
    };
    setRoutines((prev) =>
      prev.map((r) => {
        if (r.id === routineId) {
          const updated = { ...r, ...formattedUpdates };
          saveCustomItem<RoutineItem>(CUSTOM_ROUTINES_KEY, updated);
          return updated;
        }
        return r;
      })
    );
    try {
      await api.routines.update(routineId, updates as any);
    } catch (err) {
      console.error("[PlannerStore] updateRoutine error:", err);
    }
  };

  const deleteRoutine = async (routineId: string) => {
    addDeletedId(DELETED_ROUTINES_KEY, routineId);
    removeCustomItem(CUSTOM_ROUTINES_KEY, routineId);
    setRoutines((prev) => prev.filter((r) => r.id !== routineId));
    try {
      await api.routines.delete(routineId);
    } catch (err) {
      console.error("[PlannerStore] Delete routine error:", err);
    }
  };

  // ─── Instant 0ms Optimistic Habit Mutations ────────────────────────────────
  const createHabit = async (name: string) => {
    const tempId = `temp-habit-${Date.now()}`;
    const tempHabit: HabitItem = {
      id: tempId,
      name,
      streak: 0,
      completedToday: false,
      logs: [],
    };

    // Instant 0ms UI update
    setHabits((prev) => [tempHabit, ...prev]);
    saveCustomItem<HabitItem>(CUSTOM_HABITS_KEY, tempHabit);

    try {
      const created = await api.habits.create({ name });
      setHabits((prev) => prev.map((h) => (h.id === tempId ? created : h)));
      replaceCustomItem<HabitItem>(CUSTOM_HABITS_KEY, tempId, created);
      return created;
    } catch (err) {
      console.warn("[PlannerStore] Background habit create synced via local mode");
      return tempHabit;
    }
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

  const updateHabit = async (habitId: string, updates: { name: string }) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === habitId) {
          const updated = { ...h, name: updates.name };
          saveCustomItem<HabitItem>(CUSTOM_HABITS_KEY, updated);
          return updated;
        }
        return h;
      })
    );
    try {
      await api.habits.update(habitId, updates);
    } catch (err) {
      console.error("[PlannerStore] updateHabit error:", err);
    }
  };

  const deleteHabit = async (habitId: string) => {
    addDeletedId(DELETED_HABITS_KEY, habitId);
    removeCustomItem(CUSTOM_HABITS_KEY, habitId);
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
    removeCustomItem(CUSTOM_NOTES_KEY, noteId);
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    try {
      await api.notes.delete(noteId);
    } catch (err) {
      console.error("[PlannerStore] Delete note error:", err);
    }
  };

  const convertNoteToTask = async (noteId: string, taskData: Parameters<typeof api.tasks.create>[0]) => {
    await createTask(taskData);
    await deleteNote(noteId);
  };

  const convertNoteToHabit = async (noteId: string, habitName: string) => {
    await createHabit(habitName);
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
        routines,
        habits,
        contexts,
        notes,
        activeContextId,
        setActiveContextId,
        isLoading,
        refetchAll,
        createTask,
        updateTask,
        updateTaskStatus,
        deleteTask,
        createRoutine,
        updateRoutine,
        toggleRoutine,
        deleteRoutine,
        createHabit,
        updateHabit,
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

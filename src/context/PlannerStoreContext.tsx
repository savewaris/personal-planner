"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { api, HabitItem, WorkspaceContextItem } from "@/services/api";
import { TaskItem } from "@/components/TaskCard";

interface PlannerStoreContextType {
  tasks: TaskItem[];
  habits: HabitItem[];
  contexts: WorkspaceContextItem[];
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
  };
}

const PlannerStoreContext = createContext<PlannerStoreContextType | undefined>(undefined);

export const PlannerStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [contexts, setContexts] = useState<WorkspaceContextItem[]>([]);
  const [activeContextId, setActiveContextIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Local Storage Persistence Keys
  const DELETED_TASKS_KEY = "planner_deleted_task_ids";
  const DELETED_HABITS_KEY = "planner_deleted_habit_ids";
  const CUSTOM_TASKS_KEY = "planner_custom_tasks";
  const CUSTOM_HABITS_KEY = "planner_custom_habits";

  // Helper functions for localStorage deleted sets
  const getDeletedTaskIds = (): string[] => {
    try {
      const data = localStorage.getItem(DELETED_TASKS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const addDeletedTaskId = (id: string) => {
    try {
      const current = getDeletedTaskIds();
      if (!current.includes(id)) {
        localStorage.setItem(DELETED_TASKS_KEY, JSON.stringify([...current, id]));
      }
    } catch {
      // ignore
    }
  };

  const getDeletedHabitIds = (): string[] => {
    try {
      const data = localStorage.getItem(DELETED_HABITS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const addDeletedHabitId = (id: string) => {
    try {
      const current = getDeletedHabitIds();
      if (!current.includes(id)) {
        localStorage.setItem(DELETED_HABITS_KEY, JSON.stringify([...current, id]));
      }
    } catch {
      // ignore
    }
  };

  const getCustomTasks = (): TaskItem[] => {
    try {
      const data = localStorage.getItem(CUSTOM_TASKS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const saveCustomTask = (task: TaskItem) => {
    try {
      const current = getCustomTasks();
      const updated = [task, ...current.filter((t) => t.id !== task.id)];
      localStorage.setItem(CUSTOM_TASKS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const getCustomHabits = (): HabitItem[] => {
    try {
      const data = localStorage.getItem(CUSTOM_HABITS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const saveCustomHabit = (habit: HabitItem) => {
    try {
      const current = getCustomHabits();
      const updated = [habit, ...current.filter((h) => h.id !== habit.id)];
      localStorage.setItem(CUSTOM_HABITS_KEY, JSON.stringify(updated));
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
      const [tasksData, habitsData, contextsData] = await Promise.all([
        api.tasks.getAll({ contextId: activeContextId || undefined }),
        api.habits.getAll(),
        api.contexts.getAll(),
      ]);

      const deletedTaskIds = getDeletedTaskIds();
      const deletedHabitIds = getDeletedHabitIds();
      const customTasks = getCustomTasks();
      const customHabits = getCustomHabits();

      // Combine server tasks with custom local tasks & filter out deleted IDs
      const combinedTasksMap = new Map<string, TaskItem>();
      tasksData.forEach((t) => combinedTasksMap.set(t.id, t));
      customTasks.forEach((t) => combinedTasksMap.set(t.id, t));

      const filteredTasks = Array.from(combinedTasksMap.values()).filter(
        (t) => !deletedTaskIds.includes(t.id)
      );

      // Combine server habits with custom local habits & filter out deleted IDs
      const combinedHabitsMap = new Map<string, HabitItem>();
      habitsData.forEach((h) => combinedHabitsMap.set(h.id, h));
      customHabits.forEach((h) => combinedHabitsMap.set(h.id, h));

      const filteredHabits = Array.from(combinedHabitsMap.values()).filter(
        (h) => !deletedHabitIds.includes(h.id)
      );

      setTasks(filteredTasks);
      setHabits(filteredHabits);
      setContexts(contextsData);
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
    saveCustomTask(created);
    await refetchAll();
    return created;
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updated = { ...t, status: newStatus, completed: newStatus === "DONE" };
          saveCustomTask(updated);
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
    // 1. Instantly record deletion in localStorage so reloads never bring it back
    addDeletedTaskId(taskId);

    // 2. Remove from custom tasks if present
    try {
      const currentCustom = getCustomTasks().filter((t) => t.id !== taskId);
      localStorage.setItem(CUSTOM_TASKS_KEY, JSON.stringify(currentCustom));
    } catch {
      // ignore
    }

    // 3. Update React UI state
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    // 4. Send API delete call
    try {
      await api.tasks.delete(taskId);
    } catch (err) {
      console.error("[PlannerStore] Delete task API call error (handled silently):", err);
    }
  };

  // ─── Habit Mutations ──────────────────────────────────────────────────────
  const createHabit = async (name: string) => {
    const created = await api.habits.create({ name });
    saveCustomHabit(created);
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
          saveCustomHabit(updated);
          return updated;
        }
        return h;
      })
    );

    try {
      await api.habits.toggleLog(habitId);
    } catch (err) {
      console.error("[PlannerStore] Toggle habit API error (handled silently):", err);
    }
  };

  const deleteHabit = async (habitId: string) => {
    // 1. Instantly record deletion in localStorage so reloads never bring it back
    addDeletedHabitId(habitId);

    // 2. Remove from custom habits if present
    try {
      const currentCustom = getCustomHabits().filter((h) => h.id !== habitId);
      localStorage.setItem(CUSTOM_HABITS_KEY, JSON.stringify(currentCustom));
    } catch {
      // ignore
    }

    // 3. Update React UI state
    setHabits((prev) => prev.filter((h) => h.id !== habitId));

    // 4. Send API delete call
    try {
      await api.habits.delete(habitId);
    } catch (err) {
      console.error("[PlannerStore] Delete habit API error (handled silently):", err);
    }
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

    return {
      totalTasks,
      completedTasks,
      completionRate,
      activeHabits,
      maxStreak,
    };
  }, [tasks, habits]);

  return (
    <PlannerStoreContext.Provider
      value={{
        tasks,
        habits,
        contexts,
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

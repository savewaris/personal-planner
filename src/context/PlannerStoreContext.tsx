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

      setTasks(tasksData);
      setHabits(habitsData);
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
    await refetchAll();
    return created;
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus, completed: newStatus === "DONE" } : t))
    );
    try {
      await api.tasks.update(taskId, { status: newStatus });
    } catch (err) {
      console.error("[PlannerStore] Update task failed:", err);
      await refetchAll();
    }
  };

  const deleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await api.tasks.delete(taskId);
    } catch (err) {
      console.error("[PlannerStore] Delete task failed:", err);
      await refetchAll();
    }
  };

  // ─── Habit Mutations ──────────────────────────────────────────────────────
  const createHabit = async (name: string) => {
    const created = await api.habits.create({ name });
    await refetchAll();
    return created;
  };

  const toggleHabit = async (habitId: string) => {
    // Optimistic UI update
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === habitId) {
          const nextCompleted = !h.completedToday;
          const nextStreak = nextCompleted ? h.streak + 1 : Math.max(0, h.streak - 1);
          return { ...h, completedToday: nextCompleted, streak: nextStreak };
        }
        return h;
      })
    );

    try {
      await api.habits.toggleLog(habitId);
      await refetchAll();
    } catch (err) {
      console.error("[PlannerStore] Toggle habit failed:", err);
      await refetchAll();
    }
  };

  const deleteHabit = async (habitId: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    try {
      await api.habits.delete(habitId);
    } catch (err) {
      console.error("[PlannerStore] Delete habit failed:", err);
      await refetchAll();
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
      await refetchAll();
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

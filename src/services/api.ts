/**
 * Unified Typed API Client Service
 * 
 * Centralizes all HTTP requests to backend API endpoints.
 * Provides type-safe methods for Contexts, Tasks, and Habits.
 */

import { TaskItem } from "@/components/TaskCard";

export interface WorkspaceContextItem {
  id: string;
  name: string;
  color?: string | null;
  userId?: string;
}

export interface HabitItem {
  id: string;
  name: string;
  streak: number;
  completedToday?: boolean;
  logs: { id: string; date: string; completed: boolean }[];
}

class ApiService {
  private async fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP error ${res.status}`);
    }

    return res.json();
  }

  // ─── Context API ──────────────────────────────────────────────────────────
  contexts = {
    getAll: (): Promise<WorkspaceContextItem[]> => this.fetchJson("/api/contexts"),

    create: (data: { name: string; color?: string }): Promise<WorkspaceContextItem> =>
      this.fetchJson("/api/contexts", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (id: string, data: { name?: string; color?: string }): Promise<WorkspaceContextItem> =>
      this.fetchJson(`/api/contexts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    delete: (id: string): Promise<{ success: boolean }> =>
      this.fetchJson(`/api/contexts/${id}`, {
        method: "DELETE",
      }),
  };

  // ─── Task API ─────────────────────────────────────────────────────────────
  tasks = {
    getAll: (params?: { contextId?: string; status?: string; search?: string }): Promise<TaskItem[]> => {
      let url = "/api/tasks";
      const searchParams = new URLSearchParams();
      if (params?.contextId) searchParams.append("contextId", params.contextId);
      if (params?.status) searchParams.append("status", params.status);
      if (params?.search?.trim()) searchParams.append("search", params.search.trim());
      if (searchParams.toString()) url += `?${searchParams.toString()}`;
      return this.fetchJson(url);
    },

    create: (data: {
      title: string;
      description?: string;
      contextId: string;
      projectId?: string;
      status?: string;
      priority?: string;
      dueDate?: string;
      tags?: string[];
      subtasks?: any;
    }): Promise<TaskItem> =>
      this.fetchJson("/api/tasks", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<TaskItem>): Promise<TaskItem> =>
      this.fetchJson(`/api/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    delete: (id: string): Promise<{ success: boolean }> =>
      this.fetchJson(`/api/tasks/${id}`, {
        method: "DELETE",
      }),
  };

  // ─── Habit API ────────────────────────────────────────────────────────────
  habits = {
    getAll: (): Promise<HabitItem[]> => this.fetchJson("/api/habits"),

    create: (data: { name: string }): Promise<HabitItem> =>
      this.fetchJson("/api/habits", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (id: string, data: { name: string }): Promise<HabitItem> =>
      this.fetchJson(`/api/habits/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    toggleLog: (id: string, date?: string, completed?: boolean): Promise<HabitItem> =>
      this.fetchJson(`/api/habits/${id}/log`, {
        method: "POST",
        body: JSON.stringify({ date, completed }),
      }),

    delete: (id: string): Promise<{ success: boolean }> =>
      this.fetchJson(`/api/habits/${id}`, {
        method: "DELETE",
      }),
  };
}

export const api = new ApiService();

/**
 * Unified Typed API Client Service
 * 
 * Centralizes all HTTP requests to backend API endpoints.
 * Provides type-safe methods for Contexts, Tasks, Routines, Habits, and Quick Notes.
 */

import {
  TaskItem,
  WorkspaceContextItem,
  RoutineItem,
  HabitItem,
  NoteItem,
  ProjectRequirement,
  ProjectItem,
} from "@/types";

export type {
  TaskItem,
  WorkspaceContextItem,
  RoutineItem,
  HabitItem,
  NoteItem,
  ProjectRequirement,
  ProjectItem,
};

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

  // ─── Projects API ──────────────────────────────────────────────────────────
  projects = {
    getAll: (): Promise<ProjectItem[]> => this.fetchJson("/api/projects"),

    create: (data: {
      title: string;
      description?: string;
      workflow?: string;
      requirements?: ProjectRequirement[];
    }): Promise<ProjectItem> =>
      this.fetchJson("/api/projects", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (
      id: string,
      data: Partial<Omit<ProjectItem, "id">>
    ): Promise<ProjectItem> =>
      this.fetchJson(`/api/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    delete: (id: string): Promise<{ success: boolean }> =>
      this.fetchJson(`/api/projects/${id}`, {
        method: "DELETE",
      }),
  };

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
      contextId?: string;
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

  // ─── Routine API ──────────────────────────────────────────────────────────
  routines = {
    getAll: (params?: { dayKey?: string }): Promise<RoutineItem[]> => {
      let url = "/api/routines";
      if (params?.dayKey) url += `?dayKey=${params.dayKey}`;
      return this.fetchJson(url);
    },

    create: (data: { title: string; dayKey: string; tags?: string[] }): Promise<RoutineItem> =>
      this.fetchJson("/api/routines", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<RoutineItem>): Promise<RoutineItem> =>
      this.fetchJson(`/api/routines/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    delete: (id: string): Promise<{ success: boolean }> =>
      this.fetchJson(`/api/routines/${id}`, {
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

  // ─── Notes API ─────────────────────────────────────────────────────────────
  notes = {
    getAll: (): Promise<NoteItem[]> => this.fetchJson("/api/notes"),

    create: (data: { content: string; contextId?: string }): Promise<NoteItem> =>
      this.fetchJson("/api/notes", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (id: string, data: { content?: string; contextId?: string }): Promise<NoteItem> =>
      this.fetchJson(`/api/notes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    delete: (id: string): Promise<{ success: boolean }> =>
      this.fetchJson(`/api/notes/${id}`, {
        method: "DELETE",
      }),
  };
}

export const api = new ApiService();

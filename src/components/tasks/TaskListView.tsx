"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TaskItem } from "./TaskCard";

export type TaskSortBy = "createdAt" | "dueDate" | "priority" | "title" | "status";
export type TaskSortOrder = "asc" | "desc";

interface TaskListViewProps {
  tasks: TaskItem[];
  onStatusChange: (id: string, newStatus: string) => void;
  onDeleteTask: (id: string) => void;
  onEditTask?: (task: TaskItem) => void;
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  onStatusChange,
  onDeleteTask,
  onEditTask,
}) => {
  const [sortBy, setSortBy] = useState<TaskSortBy>("createdAt");
  const [sortOrder, setSortOrder] = useState<TaskSortOrder>("desc");

  // Format created timestamp cleanly
  const formatCreatedTime = (isoString?: string) => {
    if (!isoString) return null;
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return null;
    }
  };

  // Sort tasks dynamically based on selected criteria and order
  const sortedTasks = useMemo(() => {
    const list = [...tasks];
    const multiplier = sortOrder === "desc" ? -1 : 1;

    const priorityRank: Record<string, number> = {
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    const statusRank: Record<string, number> = {
      TODO: 1,
      IN_PROGRESS: 2,
      DONE: 3,
    };

    return list.sort((a, b) => {
      if (sortBy === "createdAt") {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return (timeA - timeB) * multiplier;
      }

      if (sortBy === "priority") {
        const rankA = priorityRank[a.priority] || 0;
        const rankB = priorityRank[b.priority] || 0;
        return (rankA - rankB) * multiplier;
      }

      if (sortBy === "dueDate") {
        const dueA = a.dueDate ? a.dueDate : "9999-99-99";
        const dueB = b.dueDate ? b.dueDate : "9999-99-99";
        return dueA.localeCompare(dueB) * multiplier;
      }

      if (sortBy === "status") {
        const rankA = statusRank[a.status] || 0;
        const rankB = statusRank[b.status] || 0;
        return (rankA - rankB) * multiplier;
      }

      if (sortBy === "title") {
        return a.title.localeCompare(b.title) * multiplier;
      }

      return 0;
    });
  }, [tasks, sortBy, sortOrder]);

  return (
    <div
      className="rounded-2xl border overflow-hidden shadow-xs"
      style={{
        backgroundColor: "var(--surface-card)",
        borderColor: "var(--border-subtle)",
      }}
    >
      {/* Sort Bar Header */}
      <div
        className="p-3 border-b flex flex-wrap items-center justify-between gap-3 text-xs"
        style={{
          backgroundColor: "var(--surface-subtle)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold opacity-60 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5-3L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
            </svg>
            Sort Tasks By:
          </span>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as TaskSortBy)}
            className="border rounded-xl px-3 py-1.5 text-xs font-semibold outline-none focus:border-indigo-500 cursor-pointer shadow-xs transition-all"
            style={{
              backgroundColor: "var(--surface-card)",
              borderColor: "var(--border-subtle)",
              color: "var(--foreground)",
            }}
          >
            <option value="createdAt">🕒 Created Time</option>
            <option value="dueDate">📅 Due Date</option>
            <option value="priority">⚡ Priority</option>
            <option value="title">🔤 Title</option>
            <option value="status">🎯 Status</option>
          </select>

          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))}
            className="px-3 py-1.5 rounded-xl border font-semibold shadow-xs flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-all cursor-pointer select-none"
            style={{
              backgroundColor: "var(--surface-card)",
              borderColor: "var(--border-subtle)",
            }}
            title="Toggle sort direction"
          >
            <span>{sortOrder === "desc" ? "⬇️" : "⬆️"}</span>
            <span>{sortOrder === "desc" ? "Newest / High First" : "Oldest / Low First"}</span>
          </button>
        </div>

        <span className="text-[11px] font-bold opacity-50">
          Showing {sortedTasks.length} {sortedTasks.length === 1 ? "task" : "tasks"}
        </span>
      </div>

      {/* Task Rows List */}
      <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
        <AnimatePresence mode="popLayout">
          {sortedTasks.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center text-sm opacity-50">
              No tasks found matching your filter criteria.
            </motion.div>
          ) : (
            sortedTasks.map((task) => {
              const priorityBadge = {
                HIGH: "bg-rose-500/15 text-rose-500 border-rose-500/30",
                MEDIUM: "bg-amber-500/15 text-amber-500 border-amber-500/30",
                LOW: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
              }[task.priority] || "bg-slate-500/15 text-slate-400 border-slate-500/30";

              const isDone = task.status === "DONE" || task.completed;
              const formattedCreated = formatCreatedTime(task.createdAt);

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => {
                    if (onEditTask) onEditTask(task);
                  }}
                  className={`p-3.5 flex items-center justify-between gap-4 transition-all group ${
                    onEditTask ? "cursor-pointer hover:bg-indigo-500/5" : ""
                  }`}
                  style={{
                    borderColor: "var(--border-subtle)",
                  }}
                >
                  {/* Left: Checkbox + Title & Context */}
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStatusChange(task.id, isDone ? "TODO" : "DONE");
                      }}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                        isDone
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-xs"
                          : "hover:border-indigo-500"
                      }`}
                      style={{
                        borderColor: isDone ? undefined : "var(--border-strong)",
                        backgroundColor: isDone ? undefined : "var(--surface-subtle)",
                      }}
                    >
                      {isDone && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-semibold truncate ${isDone ? "line-through opacity-50" : ""}`}>
                          {task.title}
                        </span>

                        {task.context && (
                          <span
                            className="px-2 py-0.5 text-[10px] font-semibold rounded-md border shrink-0 flex items-center gap-1.5"
                            style={{
                              backgroundColor: "var(--surface-subtle)",
                              borderColor: "var(--border-subtle)",
                            }}
                          >
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: task.context.color || "#6366f1" }}
                            />
                            {task.context.name}
                          </span>
                        )}

                        {formattedCreated && (
                          <span
                            className="text-[10px] font-medium opacity-60 px-2 py-0.5 rounded-md border shrink-0"
                            style={{
                              backgroundColor: "var(--surface-subtle)",
                              borderColor: "var(--border-subtle)",
                            }}
                            title={`Created at ${task.createdAt}`}
                          >
                            🕒 {formattedCreated}
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-xs opacity-60 truncate">{task.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Right: Priority + Status Switcher + Edit/Delete Button */}
                  <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${priorityBadge}`}>
                      {task.priority}
                    </span>

                    {/* Status Select Switcher */}
                    <select
                      value={task.status || "TODO"}
                      onChange={(e) => {
                        e.stopPropagation();
                        onStatusChange(task.id, e.target.value);
                      }}
                      className="text-xs font-semibold border rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-xs"
                      style={{
                        backgroundColor: "var(--surface-subtle)",
                        borderColor: "var(--border-subtle)",
                        color: "var(--foreground)",
                      }}
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                    </select>

                    {/* Edit Button */}
                    {onEditTask && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditTask(task);
                        }}
                        className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 text-slate-400 hover:text-indigo-500 transition-all cursor-pointer rounded-lg hover:bg-indigo-500/10 shrink-0"
                        title="Edit task"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                        </svg>
                      </button>
                    )}

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTask(task.id);
                      }}
                      className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 active:text-rose-600 transition-all cursor-pointer rounded-lg hover:bg-rose-500/10 shrink-0"
                      title="Delete task"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

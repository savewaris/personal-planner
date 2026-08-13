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
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  onStatusChange,
  onDeleteTask,
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
    <div className="glass-card rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
      {/* Sort Bar Header */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5-3L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
            </svg>
            Sort Tasks By:
          </span>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as TaskSortBy)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-semibold outline-none focus:border-indigo-500 cursor-pointer shadow-xs transition-all"
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
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold shadow-xs flex items-center gap-1.5 hover:bg-slate-100 transition-all cursor-pointer select-none"
            title="Toggle sort direction"
          >
            <span>{sortOrder === "desc" ? "⬇️" : "⬆️"}</span>
            <span>{sortOrder === "desc" ? "Newest / High First" : "Oldest / Low First"}</span>
          </button>
        </div>

        <span className="text-[11px] font-bold text-slate-400">
          Showing {sortedTasks.length} {sortedTasks.length === 1 ? "task" : "tasks"}
        </span>
      </div>

      {/* Task Rows List */}
      <div className="divide-y divide-slate-100">
        <AnimatePresence mode="popLayout">
          {sortedTasks.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center text-sm text-slate-500">
              No tasks found matching your filter criteria.
            </motion.div>
          ) : (
            sortedTasks.map((task) => {
              const priorityBadge = {
                HIGH: "bg-rose-50 text-rose-700 border-rose-200",
                MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
                LOW: "bg-emerald-50 text-emerald-700 border-emerald-200",
              }[task.priority] || "bg-slate-100 text-slate-600 border-slate-200";

              const isDone = task.status === "DONE" || task.completed;
              const formattedCreated = formatCreatedTime(task.createdAt);

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-all group"
                >
                  {/* Left: Checkbox + Title & Context */}
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => onStatusChange(task.id, isDone ? "TODO" : "DONE")}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                        isDone
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-xs"
                          : "border-slate-300 hover:border-indigo-500 bg-slate-50"
                      }`}
                    >
                      {isDone && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-sm font-semibold truncate ${isDone ? "line-through text-slate-400" : "text-slate-900"}`}>
                          {task.title}
                        </span>

                        {task.context && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md border border-slate-200 text-slate-800 shrink-0 bg-slate-50">
                            {task.context.name}
                          </span>
                        )}

                        {formattedCreated && (
                          <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 shrink-0" title={`Created at ${task.createdAt}`}>
                            🕒 {formattedCreated}
                          </span>
                        )}
                      </div>

                      {task.description && (
                        <p className="text-xs text-slate-500 truncate">{task.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Right: Priority + Status Switcher + Delete Button */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${priorityBadge}`}>
                      {task.priority}
                    </span>

                    {/* Status Select Switcher */}
                    <select
                      value={task.status || "TODO"}
                      onChange={(e) => onStatusChange(task.id, e.target.value)}
                      className="bg-slate-100 text-xs font-semibold border border-slate-200 rounded-lg px-2 py-1 text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-xs"
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                    </select>

                    {/* Delete Button */}
                    <button
                      type="button"
                      onClick={() => onDeleteTask(task.id)}
                      className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 active:text-rose-600 transition-all cursor-pointer rounded-lg hover:bg-slate-200/70 shrink-0"
                      title="Delete task"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
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

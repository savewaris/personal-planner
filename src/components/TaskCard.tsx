"use client";

import React from "react";
import { motion } from "framer-motion";

export interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  completed: boolean;
  status: "TODO" | "IN_PROGRESS" | "DONE" | string;
  priority: "LOW" | "MEDIUM" | "HIGH" | string;
  dueDate?: string | null;
  tags?: string | null;
  subtasks?: string | null;
  createdAt?: string;
  contextId: string;
  context?: {
    id: string;
    name: string;
    color?: string | null;
  };
}

interface TaskCardProps {
  task: TaskItem;
  onStatusChange: (id: string, newStatus: string) => void;
  onDelete: (id: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onStatusChange,
  onDelete,
}) => {
  // Parse tags JSON string
  const tagsList: string[] = React.useMemo(() => {
    if (!task.tags) return [];
    try {
      return typeof task.tags === "string" ? JSON.parse(task.tags) : task.tags;
    } catch {
      return task.tags.split(",").map((t) => t.trim());
    }
  }, [task.tags]);

  // Priority badge styling
  const priorityColor = {
    HIGH: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    MEDIUM: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    LOW: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  }[task.priority] || "bg-zinc-800 text-zinc-400 border-zinc-700";

  // Urgency computation
  const urgencyBadge = React.useMemo(() => {
    if (!task.dueDate) return null;
    const todayStr = new Date().toISOString().split("T")[0];
    const dueStr = task.dueDate.split("T")[0];
    const isDone = task.status === "DONE";

    if (isDone) {
      return { text: `Due ${dueStr}`, color: "bg-zinc-800/60 text-zinc-400 border-zinc-700" };
    }

    if (dueStr < todayStr) {
      return { text: `🔴 Overdue (${dueStr})`, color: "bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold animate-pulse" };
    } else if (dueStr === todayStr) {
      return { text: `🟡 Due Today`, color: "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold" };
    } else {
      return { text: `🟢 Due ${dueStr}`, color: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" };
    }
  }, [task.dueDate, task.status]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="glass-card p-4 space-y-3 border border-white/10 hover:border-indigo-500/40 relative group"
    >
      {/* Top Meta: Context Badge + Priority Pill + Delete Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {task.context && (
            <span
              className="px-2 py-0.5 text-[11px] font-semibold rounded-md border border-white/10 text-white flex items-center gap-1.5"
              style={{ backgroundColor: `${task.context.color || "#3b82f6"}25` }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: task.context.color || "#3b82f6" }}
              />
              {task.context.name}
            </span>
          )}

          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${priorityColor}`}>
            {task.priority}
          </span>

          {urgencyBadge && (
            <span className={`px-2 py-0.5 text-[10px] font-medium rounded-md border ${urgencyBadge.color}`}>
              {urgencyBadge.text}
            </span>
          )}
        </div>

        {/* Delete Button */}
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 transition-all cursor-pointer rounded-lg hover:bg-white/5"
          title="Delete task"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button>
      </div>

      {/* Task Title & Description */}
      <div className="space-y-1">
        <h4 className={`text-sm font-semibold leading-snug ${task.status === "DONE" ? "line-through text-zinc-500" : "text-zinc-100"}`}>
          {task.title}
        </h4>
        {task.description && (
          <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
            {task.description}
          </p>
        )}
      </div>

      {/* Tags */}
      {tagsList.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {tagsList.map((tag, i) => (
            <span
              key={i}
              className="px-2 py-0.5 text-[10px] font-medium text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-md"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Action Footer: Status Switcher Pills */}
      <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-1 text-[11px]">
        <span className="text-zinc-500 font-medium">Status:</span>
        <div className="flex items-center gap-1 bg-zinc-900/80 p-0.5 rounded-lg border border-white/5">
          {(["TODO", "IN_PROGRESS", "DONE"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => onStatusChange(task.id, st)}
              className={`px-2 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                task.status === st
                  ? st === "DONE"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : st === "IN_PROGRESS"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {st === "TODO" ? "To Do" : st === "IN_PROGRESS" ? "In Progress" : "Done"}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

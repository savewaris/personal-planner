"use client";

import React from "react";
import { motion } from "framer-motion";
import { getTagColorClasses } from "@/components/ui/inputs";
import { TaskItem } from "@/types";
export type { TaskItem };

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
    if (Array.isArray(task.tags)) return task.tags;
    try {
      const parsed = JSON.parse(task.tags);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return typeof task.tags === "string"
        ? task.tags.split(",").map((t: string) => t.trim()).filter(Boolean)
        : [];
    }
  }, [task.tags]);

  // Priority badge styling
  const priorityColor = {
    HIGH: "bg-rose-50 text-rose-700 border-rose-200",
    MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
    LOW: "bg-emerald-50 text-emerald-700 border-emerald-200",
  }[task.priority] || "bg-slate-100 text-slate-600 border-slate-200";

  // Urgency computation
  const urgencyBadge = React.useMemo(() => {
    if (!task.dueDate) return null;
    const todayStr = new Date().toISOString().split("T")[0];
    const dueStr = task.dueDate.split("T")[0];
    const isDone = task.status === "DONE";

    if (isDone) {
      return { text: `Due ${dueStr}`, color: "bg-slate-100 text-slate-400 border-slate-200" };
    }

    if (dueStr < todayStr) {
      return { text: `🔴 Overdue (${dueStr})`, color: "bg-rose-50 text-rose-700 border-rose-200 font-bold animate-pulse" };
    } else if (dueStr === todayStr) {
      return { text: `🟡 Due Today`, color: "bg-amber-50 text-amber-700 border-amber-200 font-bold" };
    } else {
      return { text: `🟢 Due ${dueStr}`, color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    }
  }, [task.dueDate, task.status]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className="glass-card p-4 space-y-3 border border-slate-200 hover:border-indigo-300 relative group bg-white shadow-sm hover:shadow-md transition-all"
    >
      {/* Top Meta: Context Badge + Priority Pill + Delete Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {task.context && (
            <span
              className="px-2 py-0.5 text-[11px] font-semibold rounded-md border border-slate-200 text-slate-800 flex items-center gap-1.5 bg-slate-50"
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
          className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-600 active:text-rose-600 transition-all cursor-pointer rounded-lg bg-slate-100 sm:bg-transparent hover:bg-slate-200 shrink-0"
          title="Delete task"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button>
      </div>

      {/* Task Title & Description */}
      <div className="space-y-1">
        <h4 className={`text-sm font-semibold leading-snug ${task.status === "DONE" ? "line-through text-slate-400" : "text-slate-900"}`}>
          {task.title}
        </h4>
        {task.description && (
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
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
              className={`px-2 py-0.5 text-[10px] font-semibold rounded-md border ${getTagColorClasses(tag, false)}`}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Action Footer: Status Switcher Pills */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px]">
        <span className="text-slate-500 font-medium">Status:</span>
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          {(["TODO", "IN_PROGRESS", "DONE"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => onStatusChange(task.id, st)}
              className={`px-2 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                task.status === st
                  ? st === "DONE"
                    ? "bg-white text-emerald-700 border border-emerald-300 shadow-sm"
                    : st === "IN_PROGRESS"
                    ? "bg-white text-amber-700 border border-amber-300 shadow-sm"
                    : "bg-white text-indigo-700 border border-indigo-300 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
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

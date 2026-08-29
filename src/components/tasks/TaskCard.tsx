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
  // Parse tags safely
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

  // Priority color classes
  const priorityStyle = {
    URGENT: "bg-rose-500/15 text-rose-500 border-rose-500/30",
    HIGH: "bg-rose-500/15 text-rose-500 border-rose-500/30",
    MEDIUM: "bg-amber-500/15 text-amber-500 border-amber-500/30",
    LOW: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  }[task.priority] || "bg-amber-500/15 text-amber-500 border-amber-500/30";

  // Relative Urgency / Time Badge computation
  const urgencyBadge = React.useMemo(() => {
    if (!task.dueDate) {
      return { text: "No due date", color: "opacity-60 border-[var(--border-subtle)]" };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    const due = new Date(task.dueDate.split("T")[0]);
    due.setHours(0, 0, 0, 0);
    const dueTime = due.getTime();

    const diffDays = Math.round((dueTime - todayTime) / (1000 * 60 * 60 * 24));
    const isDone = task.status === "DONE" || task.completed;

    if (isDone) {
      return { text: `✓ Completed`, color: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" };
    }

    if (diffDays < 0) {
      const overdueDays = Math.abs(diffDays);
      return {
        text: `⚠️ Overdue ${overdueDays}d`,
        color: "bg-rose-500/15 text-rose-500 border-rose-500/40 font-extrabold animate-pulse",
      };
    } else if (diffDays === 0) {
      return {
        text: `🔥 Due Today`,
        color: "bg-amber-500/15 text-amber-500 border-amber-500/40 font-extrabold",
      };
    } else if (diffDays === 1) {
      return {
        text: `⚡ Tomorrow`,
        color: "bg-indigo-500/15 text-indigo-500 border-indigo-500/40 font-bold",
      };
    } else if (diffDays <= 7) {
      return {
        text: `⚡ In ${diffDays} days`,
        color: "bg-indigo-500/15 text-indigo-500 border-indigo-500/30 font-semibold",
      };
    } else {
      return {
        text: `📅 In ${diffDays} days`,
        color: "bg-purple-500/15 text-purple-500 border-purple-500/30 font-medium",
      };
    }
  }, [task.dueDate, task.status, task.completed]);

  const isDone = task.status === "DONE" || task.completed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className="bento-card p-4 space-y-3 relative group transition-all"
      style={{
        backgroundColor: "var(--surface-card)",
        borderColor: "var(--border-subtle)",
        color: "var(--foreground)",
      }}
    >
      {/* Top Meta: Context Badge + Priority Pill + Delete Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {task.context && (
            <span
              className="px-2 py-0.5 text-[11px] font-bold rounded-md border flex items-center gap-1.5"
              style={{
                backgroundColor: "var(--surface-subtle)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: task.context.color || "#6366f1" }}
              />
              <span className="truncate max-w-[90px]">{task.context.name}</span>
            </span>
          )}

          <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md border ${priorityStyle}`}>
            {task.priority}
          </span>

          {urgencyBadge && (
            <span className={`px-2 py-0.5 text-[10px] rounded-md border ${urgencyBadge.color}`}>
              {urgencyBadge.text}
            </span>
          )}
        </div>

        {/* Delete Button */}
        <button
          type="button"
          onClick={() => onDelete(task.id)}
          aria-label={`Delete task ${task.title}`}
          className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 active:text-rose-600 transition-all cursor-pointer rounded-lg hover:bg-rose-500/10 shrink-0"
          title="Delete task"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button>
      </div>

      {/* Task Title with 1-Click Checkbox & Description */}
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          onClick={() => onStatusChange(task.id, isDone ? "TODO" : "DONE")}
          aria-label={`Mark task ${task.title} as ${isDone ? "incomplete" : "complete"}`}
          className={`w-5 h-5 rounded-md border mt-0.5 flex items-center justify-center transition-all cursor-pointer shrink-0 ${
            isDone
              ? "bg-emerald-500 border-emerald-500 text-white"
              : "hover:border-indigo-500 hover:bg-indigo-500/10"
          }`}
          style={{ borderColor: isDone ? undefined : "var(--border-strong)" }}
        >
          {isDone && <span className="text-xs font-bold">✓</span>}
        </button>

        <div className="space-y-1 flex-1 min-w-0">
          <h4 className={`text-xs font-bold leading-snug truncate ${isDone ? "line-through opacity-50" : ""}`}>
            {task.title}
          </h4>
          {task.description && (
            <p className="text-[11px] opacity-70 leading-relaxed line-clamp-2">
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Tags */}
      {tagsList.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {tagsList.map((tag, i) => (
            <span
              key={i}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${getTagColorClasses(tag, false)}`}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Action Footer: Status Switcher Pills */}
      <div
        className="pt-2.5 border-t flex items-center justify-between gap-1 text-[11px]"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <span className="opacity-60 font-semibold text-[10px]">Status:</span>
        <div
          className="flex items-center gap-1 p-0.5 rounded-lg border"
          style={{ backgroundColor: "var(--surface-subtle)", borderColor: "var(--border-subtle)" }}
        >
          {(["TODO", "IN_PROGRESS", "DONE"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => onStatusChange(task.id, st)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                task.status === st
                  ? "bg-indigo-500 text-white shadow-xs"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              {st === "TODO" ? "To Do" : st === "IN_PROGRESS" ? "In Prog" : "Done"}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

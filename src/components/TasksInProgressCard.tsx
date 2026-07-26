"use client";

import React from "react";
import { motion } from "framer-motion";
import { TaskItem } from "./TaskCard";

interface TasksInProgressCardProps {
  tasks: TaskItem[];
  onStatusChange: (id: string, newStatus: string) => void;
  onOpenAddModal: () => void;
}

export const TasksInProgressCard: React.FC<TasksInProgressCardProps> = ({
  tasks,
  onStatusChange,
  onOpenAddModal,
}) => {
  const inProgressTasks = React.useMemo(() => {
    return tasks.filter((t) => t.status === "IN_PROGRESS");
  }, [tasks]);

  return (
    <div className="glass-card p-5 border border-white/10 rounded-2xl space-y-4 relative overflow-hidden h-full flex flex-col justify-between">
      {/* Background Decorative Shimmer */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm">
              ⚡
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Tasks In Progress
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {inProgressTasks.length} active
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400">Currently executing tasks</p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={onOpenAddModal}
            className="btn-premium px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1 cursor-pointer shrink-0"
          >
            + Task
          </motion.button>
        </div>

        {/* Task List */}
        {inProgressTasks.length === 0 ? (
          <div className="py-6 text-center border border-white/10 hover:border-amber-500/30 bg-white/5 rounded-xl transition-all">
            <p className="text-xs text-zinc-400 font-medium">No tasks in progress right now.</p>
            <p className="text-[11px] text-zinc-500 mt-1">Switch a task status to "In Progress" to track it here!</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[170px] overflow-y-auto pr-1">
            {inProgressTasks.map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/40 flex items-center justify-between gap-3 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-100 truncate">{t.title}</p>
                    {t.description && (
                      <p className="text-[11px] text-zinc-400 truncate">{t.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onStatusChange(t.id, "DONE")}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all cursor-pointer"
                  >
                    ✓ Complete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

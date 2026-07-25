"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TaskItem, TaskCard } from "./TaskCard";

interface KanbanBoardProps {
  tasks: TaskItem[];
  onStatusChange: (id: string, newStatus: string) => void;
  onDeleteTask: (id: string) => void;
  onOpenAddModal: (initialStatus?: string) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onStatusChange,
  onDeleteTask,
  onOpenAddModal,
}) => {
  const columns = [
    {
      id: "TODO",
      title: "To Do",
      color: "from-indigo-500/20 to-blue-500/10 border-indigo-500/30",
      badgeColor: "bg-indigo-500/20 text-indigo-300",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      ),
    },
    {
      id: "IN_PROGRESS",
      title: "In Progress",
      color: "from-amber-500/20 to-orange-500/10 border-amber-500/30",
      badgeColor: "bg-amber-500/20 text-amber-300",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
      ),
    },
    {
      id: "DONE",
      title: "Done",
      color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30",
      badgeColor: "bg-emerald-500/20 text-emerald-300",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => (t.status || "TODO") === col.id);

        return (
          <div
            key={col.id}
            className={`rounded-2xl bg-gradient-to-b ${col.color} border p-4 space-y-4 flex flex-col min-h-[420px]`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {col.icon}
                <h3 className="font-bold text-sm text-zinc-100">{col.title}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${col.badgeColor}`}>
                  {colTasks.length}
                </span>
              </div>

              {/* Add Task Button for Column */}
              <button
                type="button"
                onClick={() => onOpenAddModal(col.id)}
                className="p-1 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer"
                title={`Add task to ${col.title}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
            </div>

            {/* Task Cards Container */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout">
                {colTasks.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.03 }}
                    transition={{ type: "spring", stiffness: 350, damping: 22 }}
                    className="py-12 border-2 border-dashed border-white/20 hover:border-indigo-500/50 bg-white/5 hover:bg-white/10 rounded-2xl text-center cursor-pointer transition-colors shadow-lg hover:shadow-indigo-500/10 group overflow-hidden"
                    onClick={() => onOpenAddModal(col.id)}
                  >
                    <p className="text-xs text-zinc-400 font-medium group-hover:text-zinc-200 transition-colors">
                      No tasks in {col.title}
                    </p>
                    <span className="inline-block mt-2 text-xs text-indigo-400 group-hover:text-indigo-300 font-semibold transition-colors">
                      + Create One
                    </span>
                  </motion.div>
                ) : (
                  colTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onStatusChange={onStatusChange}
                      onDelete={onDeleteTask}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
};

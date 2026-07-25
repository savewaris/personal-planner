"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TaskItem } from "./TaskCard";

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
  return (
    <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
      <div className="divide-y divide-white/5">
        <AnimatePresence mode="popLayout">
          {tasks.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center text-sm text-zinc-500">
              No tasks found.
            </motion.div>
          ) : (
            tasks.map((task) => {
              const priorityBadge = {
                HIGH: "bg-rose-500/15 text-rose-400 border-rose-500/30",
                MEDIUM: "bg-amber-500/15 text-amber-400 border-amber-500/30",
                LOW: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
              }[task.priority] || "bg-zinc-800 text-zinc-400 border-zinc-700";

              const isDone = task.status === "DONE" || task.completed;

              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-white/5 transition-all group"
                >
                  {/* Left: Checkbox + Title & Context */}
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => onStatusChange(task.id, isDone ? "TODO" : "DONE")}
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                        isDone
                          ? "bg-emerald-500 border-emerald-500 text-black"
                          : "border-zinc-700 hover:border-indigo-400 bg-zinc-900"
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
                        <span className={`text-sm font-semibold truncate ${isDone ? "line-through text-zinc-500" : "text-zinc-100"}`}>
                          {task.title}
                        </span>
                        {task.context && (
                          <span
                            className="px-2 py-0.5 text-[10px] font-semibold rounded-md border border-white/10 text-white shrink-0"
                            style={{ backgroundColor: `${task.context.color || "#3b82f6"}25` }}
                          >
                            {task.context.name}
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p className="text-xs text-zinc-400 truncate">{task.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Right: Priority + Status Pill + Delete */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${priorityBadge}`}>
                      {task.priority}
                    </span>

                    {/* Status Pill Switcher */}
                    <select
                      value={task.status || "TODO"}
                      onChange={(e) => onStatusChange(task.id, e.target.value)}
                      className="bg-zinc-900 text-xs font-semibold border border-white/10 rounded-lg px-2 py-1 text-zinc-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => onDeleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 transition-all cursor-pointer rounded-lg hover:bg-white/5"
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

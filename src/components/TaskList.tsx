"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { usePlannerStore } from "@/context/PlannerStoreContext";
import { KanbanBoard } from "./KanbanBoard";
import { TaskListView } from "./TaskListView";
import { TaskCalendarView } from "./TaskCalendarView";
import { CreateTaskDrawer } from "./CreateTaskDrawer";

export const TaskList: React.FC<{ isModalOpenExternal?: boolean; onCloseModalExternal?: () => void }> = ({
  isModalOpenExternal = false,
  onCloseModalExternal,
}) => {
  const { tasks, isLoading, updateTaskStatus, deleteTask } = usePlannerStore();
  const [viewMode, setViewMode] = useState<"kanban" | "list" | "calendar">("kanban");
  const [search, setSearch] = useState("");

  // Drawer Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialStatus, setInitialStatus] = useState("TODO");
  const [initialDueDate, setInitialDueDate] = useState("");

  // Sync external modal trigger
  useEffect(() => {
    if (isModalOpenExternal) {
      setIsModalOpen(true);
    }
  }, [isModalOpenExternal]);

  // Filter tasks locally by search input
  const filteredTasks = React.useMemo(() => {
    if (!search.trim()) return tasks;
    const q = search.toLowerCase();
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
    );
  }, [tasks, search]);

  const handleOpenAddModalWithStatus = (initStatus?: string, initDueDate?: string) => {
    if (initStatus) setInitialStatus(initStatus);
    if (initDueDate) setInitialDueDate(initDueDate);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Task Hub Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <h2 className="text-xl font-extrabold text-white tracking-tight">Task Hub</h2>

          {/* 3-Way View Toggle (Kanban | List | Calendar) */}
          <div className="flex items-center bg-zinc-900 border border-white/10 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "kanban"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-12-15h18" />
              </svg>
              Kanban
            </button>

            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "list"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
              List
            </button>

            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "calendar"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              Calendar
            </button>
          </div>
        </div>

        {/* Right Search Input & New Task Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter tasks..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-zinc-900 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-all"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="btn-premium flex items-center gap-2 text-xs font-semibold px-4 py-2 shrink-0 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Task
          </motion.button>
        </div>
      </div>

      {/* Main View Area */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
        </div>
      ) : viewMode === "kanban" ? (
        <KanbanBoard
          tasks={filteredTasks}
          onStatusChange={updateTaskStatus}
          onDeleteTask={deleteTask}
          onOpenAddModal={handleOpenAddModalWithStatus}
        />
      ) : viewMode === "list" ? (
        <TaskListView
          tasks={filteredTasks}
          onStatusChange={updateTaskStatus}
          onDeleteTask={deleteTask}
        />
      ) : (
        <TaskCalendarView
          tasks={filteredTasks}
          onStatusChange={updateTaskStatus}
          onDeleteTask={deleteTask}
          onOpenAddModal={handleOpenAddModalWithStatus}
        />
      )}

      {/* Create Task Standalone Drawer */}
      <CreateTaskDrawer
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          if (onCloseModalExternal) onCloseModalExternal();
        }}
        initialStatus={initialStatus}
        initialDueDate={initialDueDate}
      />
    </div>
  );
};

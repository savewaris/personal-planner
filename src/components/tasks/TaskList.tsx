"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePlannerStore } from "@/context/PlannerStoreContext";
import { KanbanBoard } from "./KanbanBoard";
import { TaskListView } from "./TaskListView";
import { CreateTaskDrawer } from "./CreateTaskDrawer";
import { EditTaskDrawer } from "./EditTaskDrawer";
import { TaskItem } from "@/types";

export const TaskList: React.FC<{ isModalOpenExternal?: boolean; onCloseModalExternal?: () => void }> = ({
  isModalOpenExternal = false,
  onCloseModalExternal,
}) => {
  const { tasks, contexts, projects, isLoading, updateTaskStatus, updateTask, deleteTask } = usePlannerStore();
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");

  // Create Drawer Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialStatus, setInitialStatus] = useState("TODO");
  const [initialDueDate, setInitialDueDate] = useState("");
  const [initialProjectId, setInitialProjectId] = useState("");

  // Edit Drawer Modal State
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  // Sync external modal trigger
  useEffect(() => {
    if (isModalOpenExternal) {
      setIsModalOpen(true);
    }
  }, [isModalOpenExternal]);

  // Filter tasks locally by project filter and search input
  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Filter by project
    if (selectedProjectId === "UNASSIGNED") {
      result = result.filter((t) => !t.projectId);
    } else if (selectedProjectId !== "ALL") {
      result = result.filter((t) => t.projectId === selectedProjectId);
    }

    // Filter by search query
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    return result;
  }, [tasks, selectedProjectId, search]);

  const handleOpenAddModalWithStatus = (
    initStatus?: string,
    initContextId?: string,
    initPriority?: string,
    initTag?: string,
    initDueDate?: string,
    initProjId?: string
  ) => {
    if (initStatus) setInitialStatus(initStatus);
    if (initDueDate) setInitialDueDate(initDueDate);
    if (initProjId) setInitialProjectId(initProjId);
    setIsModalOpen(true);
  };

  const handleOpenEditDrawer = (task: TaskItem) => {
    setEditingTask(task);
    setIsEditDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Task Hub Header Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          {/* View Toggle (Kanban | List) + Direct Full Calendar Button */}
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className="flex items-center p-1 rounded-xl border shadow-inner"
              style={{ backgroundColor: "var(--surface-subtle)", borderColor: "var(--border-subtle)" }}
            >
              <button
                type="button"
                onClick={() => setViewMode("kanban")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "kanban"
                    ? "bg-indigo-500 text-white shadow-xs"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-12-15h18" />
                </svg>
                Kanban Board
              </button>

              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "list"
                    ? "bg-indigo-500 text-white shadow-xs"
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
                List
              </button>
            </div>

            <Link
              href="/calendar"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/30 hover:bg-indigo-500/20 transition-all cursor-pointer shadow-xs"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              Open Calendar →
            </Link>
          </div>

          {/* Project Filter Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold opacity-60 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
              </svg>
              Project:
            </span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none focus:border-indigo-500 shadow-xs cursor-pointer transition-all"
              style={{
                backgroundColor: "var(--surface-subtle)",
                borderColor: "var(--border-subtle)",
                color: "var(--foreground)",
              }}
            >
              <option value="ALL">📁 All Projects ({tasks.length})</option>
              <option value="UNASSIGNED">
                Standalone / No Project ({tasks.filter((t) => !t.projectId).length})
              </option>
              {projects.map((p) => {
                const count = tasks.filter((t) => t.projectId === p.id).length;
                return (
                  <option key={p.id} value={p.id}>
                    ● {p.title} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Right Search Input & New Task Button */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter tasks..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border focus:outline-none focus:border-indigo-500 shadow-xs transition-all"
              style={{
                backgroundColor: "var(--surface-card)",
                borderColor: "var(--border-subtle)",
                color: "var(--foreground)",
              }}
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 opacity-40 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="btn-premium flex items-center gap-2 text-xs font-bold px-4 py-2 shrink-0 cursor-pointer min-h-[32px]"
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
          contexts={contexts}
          projects={projects}
          onStatusChange={updateTaskStatus}
          onUpdateTask={async (id, updates) => { await updateTask(id, updates); }}
          onDeleteTask={deleteTask}
          onEditTask={handleOpenEditDrawer}
          onOpenAddModal={handleOpenAddModalWithStatus}
        />
      ) : (
        <TaskListView
          tasks={filteredTasks}
          onStatusChange={updateTaskStatus}
          onDeleteTask={deleteTask}
          onEditTask={handleOpenEditDrawer}
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
        initialProjectId={initialProjectId}
      />

      {/* Edit Task Slide-over Drawer */}
      <EditTaskDrawer
        isOpen={isEditDrawerOpen}
        onClose={() => {
          setIsEditDrawerOpen(false);
          setEditingTask(null);
        }}
        task={editingTask}
      />
    </div>
  );
};

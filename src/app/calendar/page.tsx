"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TaskCalendarView, TaskDetailModal, TaskItem } from "@/components/tasks";
import { CalendarQuickAddModal } from "@/components/calendar";
import { CommandPalette, QuickAddFAB } from "@/components/layout";
import { usePlannerStore } from "@/context/PlannerStoreContext";

export default function CalendarPage() {
  const { tasks, updateTaskStatus, deleteTask } = usePlannerStore();
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto hide toast after 3s
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Global Cmd+K Keyboard Shortcut Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleOpenAddModalForDate = (dateStr: string) => {
    setSelectedDate(dateStr || new Date().toISOString().split("T")[0]);
    setIsQuickAddOpen(true);
  };

  const handleTaskCreatedSuccess = (title: string) => {
    setToastMessage(`Task "${title}" created successfully!`);
  };

  return (
    <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8 relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 px-4 py-3 bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-lg flex items-center gap-2 border border-emerald-500"
          >
            <span>✓</span>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6"
      >
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-white">
            Schedule <span className="gradient-text">Calendar</span>
          </h1>
          <p className="text-sm text-zinc-400">
            Overview of all scheduled tasks across your workspaces. Click any date cell to add a task.
          </p>
        </div>
      </motion.div>

      {/* Main Full-Width Calendar Component */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <TaskCalendarView
          tasks={tasks}
          onStatusChange={updateTaskStatus}
          onDeleteTask={deleteTask}
          onOpenAddModal={handleOpenAddModalForDate}
          onSelectTask={(task) => setSelectedTask(task)}
        />
      </motion.div>

      {/* Calendar Quick Add Modal */}
      <CalendarQuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        selectedDate={selectedDate}
        onSuccess={handleTaskCreatedSuccess}
      />

      {/* Task Detail / Edit Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onStatusChange={updateTaskStatus}
        onDeleteTask={deleteTask}
      />

      {/* Command Palette Overlay */}
      <CommandPalette
        isOpen={isCmdOpen}
        onClose={() => setIsCmdOpen(false)}
        onOpenTaskModal={() => handleOpenAddModalForDate(new Date().toISOString().split("T")[0])}
        onOpenHabitModal={() => {}}
      />

      {/* Floating Action Button */}
      <QuickAddFAB
        onOpenTaskModal={() => handleOpenAddModalForDate(new Date().toISOString().split("T")[0])}
        onOpenHabitModal={() => {}}
      />
    </main>
  );
}

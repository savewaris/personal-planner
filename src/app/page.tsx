"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ContextSwitcher } from "@/components/ContextSwitcher";
import { CommandPalette } from "@/components/CommandPalette";
import { CreateTaskDrawer } from "@/components/CreateTaskDrawer";
import { CreateHabitDrawer } from "@/components/CreateHabitDrawer";
import { useContextSwitcher } from "@/context/ContextSwitcherContext";
import { usePlannerStore } from "@/context/PlannerStoreContext";
import { QuickNotesInbox } from "@/components/QuickNotesInbox";
import { DashboardMiniCalendar } from "@/components/DashboardMiniCalendar";
import { TasksInProgressCard } from "@/components/TasksInProgressCard";
import { HabitTracker } from "@/components/HabitTracker";

export default function DashboardHome() {
  const { activeContext } = useContextSwitcher();
  const { tasks, habits, updateTaskStatus } = usePlannerStore();

  // Hydration Mount Safety Flag to Prevent React Error #418
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Overlay Modal States
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);

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

  // Current Date String
  const currentDateFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  return (
    <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto w-full space-y-8">
      {/* Welcome Header + Date */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {isMounted ? currentDateFormatted : "Today"}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Welcome back, <span className="gradient-text">Personal Creator</span>
          </h1>
          <p className="text-sm text-zinc-400">
            {activeContext
              ? `Overview for your ${activeContext.name} workspace.`
              : "Overview of your productivity across all workspace contexts."}
          </p>
        </div>

        {/* Context Switcher Pills Header */}
        <div className="shrink-0">
          <ContextSwitcher variant="pills" />
        </div>
      </motion.div>

      {/* Top Banner Row (4-4-4 Split): Mini Calendar | Tasks In Progress | Quick Notes Inbox */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-stretch"
      >
        {/* Left: Mini Calendar */}
        <div className="lg:col-span-4">
          <DashboardMiniCalendar
            tasks={tasks}
            onOpenAddModalWithDate={() => setIsTaskModalOpen(true)}
          />
        </div>

        {/* Center: Tasks In Progress */}
        <div className="lg:col-span-4">
          <TasksInProgressCard
            tasks={tasks}
            onStatusChange={updateTaskStatus}
            onOpenAddModal={() => setIsTaskModalOpen(true)}
          />
        </div>

        {/* Right Side of Tasks In Progress: Quick Notes Inbox */}
        <div className="lg:col-span-4">
          <QuickNotesInbox />
        </div>
      </motion.div>

      {/* Lower Section: Full-Width Daily Habits Hub & Checklist */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="w-full"
      >
        <HabitTracker
          isModalOpenExternal={isHabitModalOpen}
          onCloseModalExternal={() => setIsHabitModalOpen(false)}
        />
      </motion.div>

      {/* Standalone Drawers for Dashboard actions */}
      <CreateTaskDrawer
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
      />
      <CreateHabitDrawer
        isOpen={isHabitModalOpen}
        onClose={() => setIsHabitModalOpen(false)}
      />

      {/* Command Palette Overlay */}
      <CommandPalette
        isOpen={isCmdOpen}
        onClose={() => setIsCmdOpen(false)}
        onOpenTaskModal={() => setIsTaskModalOpen(true)}
        onOpenHabitModal={() => setIsHabitModalOpen(true)}
      />
    </main>
  );
}

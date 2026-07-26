"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ContextSwitcher } from "@/components/ContextSwitcher";
import { CommandPalette } from "@/components/CommandPalette";
import { CreateTaskDrawer } from "@/components/CreateTaskDrawer";
import { CreateHabitDrawer } from "@/components/CreateHabitDrawer";
import { useContextSwitcher } from "@/context/ContextSwitcherContext";
import { usePlannerStore } from "@/context/PlannerStoreContext";
import { HabitStreakVisualizer } from "@/components/HabitStreakVisualizer";
import { QuickNotesInbox } from "@/components/QuickNotesInbox";
import { FlameStreakBadge } from "@/components/FlameStreakBadge";
import { DashboardMiniCalendar } from "@/components/DashboardMiniCalendar";
import { TasksInProgressCard } from "@/components/TasksInProgressCard";

export default function DashboardHome() {
  const { activeContext } = useContextSwitcher();
  const { tasks, habits, isLoading, updateTaskStatus, toggleHabit, stats } = usePlannerStore();

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

  // Filter tasks for dashboard view
  const recentTasks = useMemo(() => tasks.slice(0, 5), [tasks]);
  const completedTodayHabits = useMemo(() => habits.filter((h) => h.completedToday).length, [habits]);

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

      {/* Top Banner Row: Mini Calendar (Left) & Tasks In Progress (Right) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
      >
        <div className="lg:col-span-5">
          <DashboardMiniCalendar
            tasks={tasks}
            onOpenAddModalWithDate={() => setIsTaskModalOpen(true)}
          />
        </div>
        <div className="lg:col-span-7">
          <TasksInProgressCard
            tasks={tasks}
            onStatusChange={updateTaskStatus}
            onOpenAddModal={() => setIsTaskModalOpen(true)}
          />
        </div>
      </motion.div>

      {/* 3-Column Dashboard Layout: Left (Tasks) | Middle (Habits) | Far Right Edge (Quick Notes Inbox) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-start"
      >
        {/* Column 1 (Left): Recent Tasks */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-6 border border-white/10 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Recent Tasks</h3>
                <p className="text-xs text-zinc-400">Quick snapshot of your active tasks</p>
              </div>

              <div className="flex items-center gap-3">
                {/* Direct + New Task Button */}
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => setIsTaskModalOpen(true)}
                  className="btn-premium px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <span>+ New Task</span>
                </motion.button>

                <Link
                  href="/tasks"
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  View Hub →
                </Link>
              </div>
            </div>

            {isLoading ? (
              <div className="py-8 flex justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
              </div>
            ) : recentTasks.length === 0 ? (
              <div className="py-8 text-center border border-white/10 hover:border-indigo-500/40 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
                <p className="text-xs text-zinc-500">No tasks created yet.</p>
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(true)}
                  className="mt-2 text-xs text-indigo-400 hover:underline cursor-pointer font-semibold"
                >
                  + Create Your First Task
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentTasks.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-3 hover:border-white/15 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => updateTaskStatus(t.id, t.completed ? "TODO" : "DONE")}
                        className={`w-5 h-5 rounded flex items-center justify-center transition-all cursor-pointer ${
                          t.completed
                            ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                            : "border border-zinc-700 hover:border-indigo-400 bg-zinc-900"
                        }`}
                      >
                        {t.completed && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 stroke-[3]" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                      <span className={`text-xs font-semibold truncate ${t.completed ? "line-through text-zinc-500" : "text-zinc-200"}`}>
                        {t.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                        {t.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Column 2 (Middle): Daily Habits */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-6 border border-white/10 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Daily Habits</h3>
                <p className="text-xs text-zinc-400">{completedTodayHabits} of {habits.length} done today</p>
              </div>
              <div className="flex items-center gap-3">
                {/* Direct + New Habit Button */}
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => setIsHabitModalOpen(true)}
                  className="btn-premium px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <span>+ Add Habit</span>
                </motion.button>

                <HabitStreakVisualizer streak={stats.maxStreak} />
              </div>
            </div>

            {isLoading ? (
              <div className="py-8 flex justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
              </div>
            ) : habits.length === 0 ? (
              <div className="py-8 text-center border border-white/10 hover:border-indigo-500/40 bg-white/5 hover:bg-white/10 rounded-2xl transition-all">
                <p className="text-xs text-zinc-500">No habits added yet.</p>
                <button
                  type="button"
                  onClick={() => setIsHabitModalOpen(true)}
                  className="mt-2 text-xs text-indigo-400 hover:underline cursor-pointer font-semibold"
                >
                  + Create Your First Habit
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {habits.map((h) => (
                  <div
                    key={h.id}
                    className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between gap-3 hover:border-white/15 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleHabit(h.id)}
                        className={`w-5 h-5 rounded flex items-center justify-center transition-all cursor-pointer ${
                          h.completedToday
                            ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/20"
                            : "border border-zinc-700 hover:border-indigo-400 bg-zinc-900"
                        }`}
                      >
                        {h.completedToday && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 stroke-[3]" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                      <span className={`text-xs font-semibold truncate ${h.completedToday ? "line-through text-zinc-500" : "text-zinc-200"}`}>
                        {h.name}
                      </span>
                    </div>

                    {/* Integrated Flame Streak Badge */}
                    <FlameStreakBadge streak={h.streak} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Column 3 (Far Right Edge): Quick Notes Inbox */}
        <div className="lg:col-span-3 space-y-6">
          <QuickNotesInbox />
        </div>
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

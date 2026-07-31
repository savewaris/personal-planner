"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlannerStore } from "@/context/PlannerStoreContext";
import { WeeklyRoutineCalendar } from "@/components/WeeklyRoutineCalendar";
import { QuickTaskFeed } from "@/components/QuickTaskFeed";
import { HabitTrackerFeed } from "@/components/HabitTrackerFeed";
import { ContextSwitcher } from "@/components/ContextSwitcher";

type SectionFocus = "ALL" | "ROUTINES" | "TASKS" | "HABITS";

export default function DashboardPage() {
  const {
    tasks,
    routines,
    habits,
    activeContextId,
    setActiveContextId,
    isLoading,
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    createRoutine,
    updateRoutine,
    toggleRoutine,
    deleteRoutine,
    createHabit,
    updateHabit,
    toggleHabit,
    deleteHabit,
    stats,
  } = usePlannerStore();

  const [selectedRoutineDate, setSelectedRoutineDate] = useState<string>("MON");
  const [sectionFocus, setSectionFocus] = useState<SectionFocus>("ALL");

  // Format today's date
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }, []);

  // Compute existing tags across tasks and routines for tag autocomplete
  const existingTags = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (t.tags) {
        try {
          const parsed = JSON.parse(t.tags);
          if (Array.isArray(parsed)) parsed.forEach((pt) => set.add(pt));
        } catch {
          t.tags.split(",").forEach((st) => set.add(st.trim()));
        }
      }
    });
    routines.forEach((r) => {
      if (r.tags) {
        try {
          const parsed = JSON.parse(r.tags);
          if (Array.isArray(parsed)) parsed.forEach((pt) => set.add(pt));
        } catch {
          r.tags.split(",").forEach((st) => set.add(st.trim()));
        }
      }
    });
    return Array.from(set);
  }, [tasks, routines]);

  // Wrappers for creation
  const handleAddTask = async (title: string, tags?: string[]) => {
    await createTask({ title, tags, contextId: activeContextId || undefined });
  };

  const handleAddRoutine = async (title: string, dayKey: string, tags?: string[]) => {
    await createRoutine({ title, dayKey, tags });
  };

  const handleAddHabit = async (name: string) => {
    await createHabit(name);
  };

  return (
    <main className="flex-1 py-6 px-4 sm:px-6 lg:px-10 max-w-full mx-auto w-full space-y-5 pb-12">
      {/* Compact Header: Title + Context Filter Side-by-Side */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 glass-card p-4 rounded-2xl border border-white/10"
      >
        {/* Left: Compact Dashboard Title */}
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-1.5 shrink-0">
            <span>Planner Dashboard</span>
            <span className="text-indigo-400">✨</span>
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/5 border border-white/10 text-zinc-300 shrink-0">
            {todayFormatted}
          </span>
        </div>

        {/* Right: Context Filter Side-by-Side + Stats Badge */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-zinc-950/60 px-3 py-1.5 rounded-xl border border-white/10">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider shrink-0">
              Context:
            </span>
            <ContextSwitcher variant="pills" />
            {activeContextId && (
              <button
                onClick={() => setActiveContextId(null)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer ml-1"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-950/60 px-3 py-1.5 rounded-xl border border-white/10 shrink-0">
            <span>Tasks: <strong className="text-indigo-400">{stats.totalTasks}</strong></span>
            <span className="text-zinc-600">•</span>
            <span>Done: <strong className="text-emerald-400">{stats.completionRate}%</strong></span>
            <span className="text-zinc-600">•</span>
            <span>Streak: <strong className="text-amber-400">🔥 {stats.maxStreak}d</strong></span>
          </div>
        </div>
      </motion.div>

      {/* Tight Fit View Switcher Bar (w-fit mx-auto) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="w-fit mx-auto flex items-center justify-center bg-zinc-950/90 p-1.5 rounded-2xl border border-white/10 shadow-lg"
      >
        <div className="flex items-center gap-1">
          {[
            { id: "ALL", label: "🌐 All View" },
            { id: "ROUTINES", label: "📅 Routines Focus" },
            { id: "TASKS", label: "⚡ Tasks Focus" },
            { id: "HABITS", label: "🔥 Habits Focus" },
          ].map((item) => {
            const isActive = sectionFocus === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSectionFocus(item.id as SectionFocus)}
                className={`relative px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer select-none ${
                  isActive ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeSectionPill"
                    className="absolute inset-0 bg-white/10 rounded-xl border border-white/20 shadow-md"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Dynamic Centered Focus Mode & Layout Grid */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {sectionFocus === "ALL" ? (
          /* Standard Equal 3-Column Layout */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
            {/* Routines */}
            <div className="transition-all duration-300">
              <WeeklyRoutineCalendar
                routines={routines}
                selectedDateStr={selectedRoutineDate}
                onSelectDate={(key) => setSelectedRoutineDate(key || "MON")}
                onToggleRoutine={toggleRoutine}
                onDeleteRoutine={deleteRoutine}
                onAddRoutine={handleAddRoutine}
                onUpdateRoutine={async (id, updates) => { await updateRoutine(id, updates); }}
                existingTags={existingTags}
              />
            </div>

            {/* Tasks */}
            <div className="transition-all duration-300">
              <QuickTaskFeed
                tasks={tasks}
                onToggleTask={updateTaskStatus}
                onDeleteTask={deleteTask}
                onAddTask={handleAddTask}
                onUpdateTask={async (id, updates) => { await updateTask(id, updates); }}
                isLoading={isLoading}
                existingTags={existingTags}
              />
            </div>

            {/* Habits */}
            <div className="transition-all duration-300">
              <HabitTrackerFeed
                habits={habits}
                onToggleHabit={toggleHabit}
                onDeleteHabit={deleteHabit}
                onAddHabit={handleAddHabit}
                onUpdateHabit={async (id, updates) => { await updateHabit(id, updates); }}
                isLoading={isLoading}
              />
            </div>
          </div>
        ) : (
          /* Focused View: Selected Section Centered (max-w-2xl) with Minimized Side Cards */
          <div className="space-y-6">
            {/* Centered Stage Box */}
            <div className="w-full max-w-2xl mx-auto">
              <div className="mb-2 text-center">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  🎯 Focused: {sectionFocus}
                </span>
              </div>

              {sectionFocus === "ROUTINES" && (
                <div className="ring-2 ring-indigo-500/60 rounded-2xl shadow-2xl shadow-indigo-500/20 scale-[1.01] transition-all">
                  <WeeklyRoutineCalendar
                    routines={routines}
                    selectedDateStr={selectedRoutineDate}
                    onSelectDate={(key) => setSelectedRoutineDate(key || "MON")}
                    onToggleRoutine={toggleRoutine}
                    onDeleteRoutine={deleteRoutine}
                    onAddRoutine={handleAddRoutine}
                    onUpdateRoutine={async (id, updates) => { await updateRoutine(id, updates); }}
                    existingTags={existingTags}
                  />
                </div>
              )}

              {sectionFocus === "TASKS" && (
                <div className="ring-2 ring-purple-500/60 rounded-2xl shadow-2xl shadow-purple-500/20 scale-[1.01] transition-all">
                  <QuickTaskFeed
                    tasks={tasks}
                    onToggleTask={updateTaskStatus}
                    onDeleteTask={deleteTask}
                    onAddTask={handleAddTask}
                    onUpdateTask={async (id, updates) => { await updateTask(id, updates); }}
                    isLoading={isLoading}
                    existingTags={existingTags}
                  />
                </div>
              )}

              {sectionFocus === "HABITS" && (
                <div className="ring-2 ring-amber-500/60 rounded-2xl shadow-2xl shadow-amber-500/20 scale-[1.01] transition-all">
                  <HabitTrackerFeed
                    habits={habits}
                    onToggleHabit={toggleHabit}
                    onDeleteHabit={deleteHabit}
                    onAddHabit={handleAddHabit}
                    onUpdateHabit={async (id, updates) => { await updateHabit(id, updates); }}
                    isLoading={isLoading}
                  />
                </div>
              )}
            </div>

            {/* Minimized Side Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto pt-2 border-t border-white/5">
              <div className="text-xs font-bold text-zinc-400 col-span-full text-center">
                Click any minimized card below to switch focus:
              </div>

              {sectionFocus !== "ROUTINES" && (
                <div
                  onClick={() => setSectionFocus("ROUTINES")}
                  className="opacity-45 hover:opacity-85 scale-95 hover:scale-100 transition-all cursor-pointer rounded-2xl filter brightness-75 hover:brightness-100"
                >
                  <WeeklyRoutineCalendar
                    routines={routines}
                    selectedDateStr={selectedRoutineDate}
                    onSelectDate={(key) => setSelectedRoutineDate(key || "MON")}
                    onToggleRoutine={toggleRoutine}
                    onDeleteRoutine={deleteRoutine}
                    onAddRoutine={handleAddRoutine}
                    existingTags={existingTags}
                  />
                </div>
              )}

              {sectionFocus !== "TASKS" && (
                <div
                  onClick={() => setSectionFocus("TASKS")}
                  className="opacity-45 hover:opacity-85 scale-95 hover:scale-100 transition-all cursor-pointer rounded-2xl filter brightness-75 hover:brightness-100"
                >
                  <QuickTaskFeed
                    tasks={tasks}
                    onToggleTask={updateTaskStatus}
                    onDeleteTask={deleteTask}
                    onAddTask={handleAddTask}
                    isLoading={isLoading}
                    existingTags={existingTags}
                  />
                </div>
              )}

              {sectionFocus !== "HABITS" && (
                <div
                  onClick={() => setSectionFocus("HABITS")}
                  className="opacity-45 hover:opacity-85 scale-95 hover:scale-100 transition-all cursor-pointer rounded-2xl filter brightness-75 hover:brightness-100"
                >
                  <HabitTrackerFeed
                    habits={habits}
                    onToggleHabit={toggleHabit}
                    onDeleteHabit={deleteHabit}
                    onAddHabit={handleAddHabit}
                    isLoading={isLoading}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </main>
  );
}

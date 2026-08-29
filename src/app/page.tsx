"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { usePlannerStore } from "@/context/PlannerStoreContext";
import { TaskItem, HabitItem, ProjectItem, NoteItem } from "@/services/api";
import { CommandPalette, QuickAddFAB } from "@/components/layout";
import { CreateTaskDrawer } from "@/components/tasks";
import { QuickBrainDumpModal } from "@/components/notes";
import { CreateHabitDrawer } from "@/components/habits";
import { useKeyboardShortcut } from "@/hooks";

export default function DashboardPage() {
  const {
    tasks,
    habits,
    projects,
    notes,
    contexts,
    activeContextId,
    setActiveContextId,
    updateTaskStatus,
    toggleHabit,
    createNote,
  } = usePlannerStore();

  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);
  const [isHabitDrawerOpen, setIsHabitDrawerOpen] = useState(false);
  const [isBrainDumpOpen, setIsBrainDumpOpen] = useState(false);
  const [quickNoteText, setQuickNoteText] = useState("");
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Global Keyboard Shortcuts
  useKeyboardShortcut("k", () => setIsCmdOpen((prev) => !prev));
  useKeyboardShortcut("i", () => setIsBrainDumpOpen(true));

  // Today's Date Info
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const dateFormatted = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  // Time of Day Greeting
  const hour = today.getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  // Filter items by active context (if set)
  const filteredTasks = useMemo(() => {
    let list = tasks;
    if (activeContextId) {
      list = list.filter((t) => t.contextId === activeContextId);
    }
    return list;
  }, [tasks, activeContextId]);

  const pendingTasks = useMemo(() => filteredTasks.filter((t) => !t.completed && t.status !== "DONE"), [filteredTasks]);
  const completedTasks = useMemo(() => filteredTasks.filter((t) => t.completed || t.status === "DONE"), [filteredTasks]);

  // Today's completed habit logs helper
  const isHabitDoneToday = (habit: HabitItem) => {
    return habit.completedToday || habit.logs?.some((log) => log.date === todayStr && log.completed) || false;
  };

  const handleToggleHabitToday = async (habit: HabitItem) => {
    await toggleHabit(habit.id);
  };

  const handleQuickNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNoteText.trim()) return;
    setIsSubmittingNote(true);
    try {
      await createNote(quickNoteText.trim());
      setQuickNoteText("");
    } catch (err) {
      console.error("Failed to create note:", err);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const parseRequirements = (raw: any) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  };

  return (
    <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto w-full space-y-8 pb-16">
      {/* ─── Hero Header & Context Filter Bar ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2"
      >
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-indigo-500">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span>Command Center • {dateFormatted}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            {greeting}, <span className="gradient-text">Creator</span>
          </h1>
          <p className="text-sm opacity-70 max-w-xl">
            Here is your live productivity pulse across tasks, daily habit streaks, projects, and triage inbox.
          </p>
        </div>

        {/* Workspace Context Switcher Pills */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl border flex-wrap" style={{ backgroundColor: "var(--surface-card)", borderColor: "var(--border-subtle)" }}>
          <button
            type="button"
            onClick={() => setActiveContextId(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeContextId === null
                ? "bg-indigo-600 text-white shadow-xs"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            All Workspaces ({tasks.length})
          </button>
          {contexts.map((ctx) => {
            const isActive = activeContextId === ctx.id;
            const count = tasks.filter((t) => t.contextId === ctx.id).length;
            return (
              <button
                key={ctx.id}
                type="button"
                onClick={() => setActiveContextId(ctx.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 border ${
                  isActive
                    ? "bg-indigo-500/15 text-indigo-500 border-indigo-500/30"
                    : "border-transparent opacity-70 hover:opacity-100 hover:border-[var(--border-subtle)]"
                }`}
              >
                <span className={`w-2 h-2 rounded-full bg-${ctx.color || "indigo"}-500`} />
                <span>{ctx.name}</span>
                <span className="text-[10px] opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ─── Bento Grid Matrix ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
        
        {/* ─── Bento 1: Tasks In Progress (Span 2 Cols) ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30, delay: 0.05 }}
          className="bento-card md:col-span-2 p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center gap-2.5">
              <span className="text-xl">⚡</span>
              <div>
                <h2 className="text-base font-extrabold">Tasks in Progress</h2>
                <p className="text-xs opacity-70">{pendingTasks.length} pending • {completedTasks.length} done</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsTaskDrawerOpen(true)}
                className="px-3 py-1.5 min-h-[28px] rounded-xl bg-indigo-500/15 text-indigo-500 border border-indigo-500/30 font-bold text-xs hover:bg-indigo-500/25 transition-all cursor-pointer inline-flex items-center"
              >
                + New Task
              </button>
              <Link
                href="/tasks"
                className="px-3 py-1.5 min-h-[28px] rounded-xl border text-xs font-bold opacity-70 hover:opacity-100 transition-all cursor-pointer inline-flex items-center"
                style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--surface-subtle)" }}
              >
                Kanban ↗
              </Link>
            </div>
          </div>

          {/* Task Checklist */}
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
            {pendingTasks.length === 0 ? (
              <div className="py-10 text-center space-y-2 opacity-60">
                <span className="text-3xl block">🎉</span>
                <p className="text-xs font-semibold">All tasks completed! Enjoy the momentum.</p>
              </div>
            ) : (
              pendingTasks.slice(0, 6).map((task) => (
                <div
                  key={task.id}
                  className="p-3 rounded-xl border flex items-center justify-between gap-3 group transition-all"
                  style={{ backgroundColor: "var(--surface-subtle)", borderColor: "var(--border-subtle)" }}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => updateTaskStatus(task.id, "DONE")}
                      aria-label={`Mark task ${task.title} as completed`}
                      className="w-6 h-6 rounded-md border flex items-center justify-center transition-all cursor-pointer hover:border-indigo-500 hover:bg-indigo-500/10 shrink-0"
                      style={{ borderColor: "var(--border-strong)" }}
                    >
                      {task.completed && <span className="text-xs text-indigo-500">✓</span>}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate group-hover:text-indigo-500 transition-colors">
                        {task.title}
                      </p>
                      {task.dueDate && (
                        <p className="text-[10px] opacity-60 font-medium">Due: {task.dueDate}</p>
                      )}
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                    task.priority === "HIGH"
                      ? "bg-rose-500/15 text-rose-500 border border-rose-500/30"
                      : task.priority === "LOW"
                      ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                  }`}>
                    {task.priority || "MED"}
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* ─── Bento 2: Habit Flame Streaks ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30, delay: 0.1 }}
          className="bento-card p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🔥</span>
              <div>
                <h2 className="text-base font-extrabold">Habit Streaks</h2>
                <p className="text-xs opacity-70">Daily Consistency</p>
              </div>
            </div>
            <Link
              href="/habits"
              className="text-xs font-bold text-indigo-500 hover:underline min-h-[28px] inline-flex items-center px-2 py-1"
            >
              All ↗
            </Link>
          </div>

          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
            {habits.length === 0 ? (
              <div className="py-8 text-center space-y-2 opacity-60">
                <span className="text-3xl block">🌱</span>
                <p className="text-xs font-semibold">No habits tracked yet.</p>
                <button
                  type="button"
                  onClick={() => setIsHabitDrawerOpen(true)}
                  className="btn-premium px-3.5 py-1.5 min-h-[28px] text-xs font-bold rounded-lg cursor-pointer inline-flex items-center justify-center"
                >
                  + Add Habit
                </button>
              </div>
            ) : (
              habits.slice(0, 5).map((habit) => {
                const isDone = isHabitDoneToday(habit);

                return (
                  <div
                    key={habit.id}
                    className="p-3 rounded-xl border flex items-center justify-between gap-2 transition-all"
                    style={{ backgroundColor: "var(--surface-subtle)", borderColor: "var(--border-subtle)" }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleHabitToday(habit)}
                        aria-label={`Toggle habit ${habit.name} for today`}
                        className={`w-7 h-7 rounded-lg border flex items-center justify-center font-bold text-xs transition-all cursor-pointer ${
                          isDone
                            ? "bg-emerald-500 border-emerald-500 text-white shadow-xs"
                            : "border-[var(--border-strong)] hover:border-emerald-500"
                        }`}
                      >
                        {isDone ? "✓" : ""}
                      </button>
                      <span className={`text-xs font-bold truncate ${isDone ? "opacity-60 line-through" : ""}`}>
                        {habit.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 font-extrabold text-[11px]">
                      <span>🔥</span>
                      <span>{habit.streak || 0}d</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* ─── Bento 3: Instant Idea Capture (Brain Dump) ───────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30, delay: 0.15 }}
          className="bento-card p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center gap-2.5">
              <span className="text-xl">💡</span>
              <div>
                <h2 className="text-base font-extrabold">Instant Brain Dump</h2>
                <p className="text-xs opacity-70">{notes.length} thoughts in Inbox</p>
              </div>
            </div>
            <Link
              href="/inbox"
              className="text-xs font-bold text-indigo-500 hover:underline min-h-[28px] inline-flex items-center px-2 py-1"
            >
              Triage ↗
            </Link>
          </div>

          <form onSubmit={handleQuickNoteSubmit} className="space-y-2">
            <input
              type="text"
              value={quickNoteText}
              onChange={(e) => setQuickNoteText(e.target.value)}
              placeholder="Dump a thought + Enter..."
              disabled={isSubmittingNote}
              className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:border-indigo-500"
              style={{ backgroundColor: "var(--surface-subtle)", borderColor: "var(--border-subtle)" }}
            />
            <button
              type="submit"
              disabled={!quickNoteText.trim() || isSubmittingNote}
              className="btn-premium w-full py-1.5 text-xs font-bold rounded-xl cursor-pointer disabled:opacity-40"
            >
              {isSubmittingNote ? "Capturing..." : "+ Capture to Inbox"}
            </button>
          </form>

          {/* Recent Notes Preview */}
          <div className="space-y-1.5 pt-1">
            {notes.slice(0, 3).map((note) => (
              <div
                key={note.id}
                className="p-2.5 rounded-lg border text-xs opacity-80 truncate"
                style={{ backgroundColor: "var(--surface-subtle)", borderColor: "var(--border-subtle)" }}
              >
                💭 {note.content}
              </div>
            ))}
          </div>
        </motion.div>

        {/* ─── Bento 4: Active Building Projects (Span 2 Cols) ───────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30, delay: 0.2 }}
          className="bento-card md:col-span-2 p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center gap-2.5">
              <span className="text-xl">📁</span>
              <div>
                <h2 className="text-base font-extrabold">Active Projects & Workflows</h2>
                <p className="text-xs opacity-70">{projects.length} building projects registered</p>
              </div>
            </div>
            <Link
              href="/projects"
              className="btn-premium px-3 py-1 rounded-xl text-xs font-bold"
            >
              Open Studio ↗
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.length === 0 ? (
              <div className="col-span-2 py-8 text-center space-y-2 opacity-60">
                <span className="text-3xl block">🚀</span>
                <p className="text-xs font-semibold">No active projects yet.</p>
              </div>
            ) : (
              projects.slice(0, 4).map((proj) => {
                const reqs = parseRequirements(proj.requirements);
                const doneCount = reqs.filter((r: any) => r.completed).length;
                const percent = reqs.length > 0 ? Math.round((doneCount / reqs.length) * 100) : 0;

                return (
                  <Link
                    key={proj.id}
                    href="/projects"
                    className="p-4 rounded-xl border space-y-2.5 hover:border-indigo-500/60 transition-all group block"
                    style={{ backgroundColor: "var(--surface-subtle)", borderColor: "var(--border-subtle)" }}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black truncate group-hover:text-indigo-500 transition-colors">
                        {proj.title}
                      </h3>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-500 border border-indigo-500/30">
                        {percent}%
                      </span>
                    </div>

                    {proj.description && (
                      <p className="text-[11px] opacity-70 line-clamp-2">{proj.description}</p>
                    )}

                    {/* Progress Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="h-1.5 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] opacity-60 font-semibold">
                        <span>Requirements</span>
                        <span>{doneCount}/{reqs.length} done</span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </motion.div>

        {/* ─── Bento 5: Quick Productivity Stats & Hotkeys (Span 2 Cols) ─────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 30, delay: 0.25 }}
          className="bento-card md:col-span-2 p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="flex items-center gap-2.5">
              <span className="text-xl">⌨️</span>
              <div>
                <h2 className="text-base font-extrabold">Quick Hotkeys & Hub Shortcuts</h2>
                <p className="text-xs opacity-70">Keyboard-first execution flow</p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
              Vim & Mac Ready
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: "⌘K", label: "Command Search", desc: "Open global search" },
              { key: "⌘I", label: "Quick Brain Dump", desc: "Instant note dump" },
              { key: "📅", label: "Calendar View", desc: "Full month agenda", href: "/calendar" },
              { key: "📊", label: "Kanban Hub", desc: "Drag & drop tasks", href: "/tasks" },
            ].map((hk) => (
              <div
                key={hk.label}
                className="p-3 rounded-xl border space-y-1 text-center"
                style={{ backgroundColor: "var(--surface-subtle)", borderColor: "var(--border-subtle)" }}
              >
                <kbd className="px-2 py-0.5 rounded text-xs font-black font-mono inline-block border" style={{ backgroundColor: "var(--surface-card)", borderColor: "var(--border-subtle)" }}>
                  {hk.key}
                </kbd>
                <p className="text-xs font-bold pt-1">{hk.label}</p>
                <p className="text-[10px] opacity-60">{hk.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

      </div>

      {/* Command Palette Overlay */}
      <CommandPalette
        isOpen={isCmdOpen}
        onClose={() => setIsCmdOpen(false)}
        onOpenTaskModal={() => setIsTaskDrawerOpen(true)}
        onOpenHabitModal={() => setIsHabitDrawerOpen(true)}
      />

      {/* Floating Action Button */}
      <QuickAddFAB
        onOpenTaskModal={() => setIsTaskDrawerOpen(true)}
        onOpenHabitModal={() => setIsHabitDrawerOpen(true)}
      />

      {/* Drawers and Modals */}
      <CreateTaskDrawer
        isOpen={isTaskDrawerOpen}
        onClose={() => setIsTaskDrawerOpen(false)}
      />

      <CreateHabitDrawer
        isOpen={isHabitDrawerOpen}
        onClose={() => setIsHabitDrawerOpen(false)}
      />

      <QuickBrainDumpModal
        isOpen={isBrainDumpOpen}
        onClose={() => setIsBrainDumpOpen(false)}
      />
    </main>
  );
}

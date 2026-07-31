"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HabitItem } from "@/services/api";

interface HabitTrackerFeedProps {
  habits: HabitItem[];
  onToggleHabit: (habitId: string) => Promise<void>;
  onDeleteHabit: (habitId: string) => Promise<void>;
  onAddHabit?: (name: string) => Promise<void>;
  onUpdateHabit?: (habitId: string, updates: { name: string }) => Promise<void>;
  isLoading?: boolean;
}

interface CellDetails {
  dateStr: string;
  formattedDate: string;
  completedHabitNames: string[];
  count: number;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const AVAILABLE_YEARS = [2026, 2025, 2024, 2023];

// Helper to generate 52-week matrix for a specific target year (Sun-Sat)
const generateYearMatrix = (year: number) => {
  const weeks: { weekIndex: number; monthLabel: string | null; days: { dateStr: string; dayOfWeek: number; dateObj: Date }[] }[] = [];
  
  const startDate = new Date(year, 0, 1);
  const startDayOfWeek = startDate.getDay();
  startDate.setDate(startDate.getDate() - startDayOfWeek);

  const endDate = new Date(year, 11, 31);
  const endDayOfWeek = endDate.getDay();
  endDate.setDate(endDate.getDate() + (6 - endDayOfWeek));

  let current = new Date(startDate);
  let currentWeek: { dateStr: string; dayOfWeek: number; dateObj: Date }[] = [];
  let lastMonth = -1;

  while (current <= endDate) {
    const dateStr = current.toISOString().split("T")[0];
    const month = current.getMonth();
    const dayOfWeek = current.getDay();

    currentWeek.push({
      dateStr,
      dayOfWeek,
      dateObj: new Date(current),
    });

    if (dayOfWeek === 6 || current.getTime() >= endDate.getTime()) {
      let monthLabel: string | null = null;
      if (month !== lastMonth && current.getFullYear() === year) {
        monthLabel = MONTH_NAMES[month];
        lastMonth = month;
      }

      weeks.push({
        weekIndex: weeks.length,
        monthLabel,
        days: currentWeek,
      });
      currentWeek = [];
    }

    current.setDate(current.getDate() + 1);
  }

  return weeks;
};

export const HabitTrackerFeed: React.FC<HabitTrackerFeedProps> = ({
  habits,
  onToggleHabit,
  onDeleteHabit,
  onAddHabit,
  onUpdateHabit,
  isLoading = false,
}) => {
  const [inputText, setInputText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedHabitFilter, setSelectedHabitFilter] = useState<string>("ALL");
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [hoveredCell, setHoveredCell] = useState<CellDetails | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Direct Inline Edit State
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");

  // Generate 52 weeks matrix for selected year
  const weeksMatrix = useMemo(() => generateYearMatrix(selectedYear), [selectedYear]);
  const todayISO = useMemo(() => new Date().toISOString().split("T")[0], []);

  // Aggregate completed habit names per date string
  const habitsByDate = useMemo(() => {
    const map = new Map<string, { habitId: string; habitName: string }[]>();

    habits.forEach((h) => {
      if (selectedHabitFilter !== "ALL" && h.id !== selectedHabitFilter) return;

      // 1. From habit logs
      if (Array.isArray(h.logs)) {
        h.logs.forEach((log) => {
          if (log.completed && log.date) {
            const dateStr = log.date.split("T")[0];
            const list = map.get(dateStr) || [];
            if (!list.some((item) => item.habitId === h.id)) {
              list.push({ habitId: h.id, habitName: h.name });
            }
            map.set(dateStr, list);
          }
        });
      }

      // 2. Today's live toggle state override
      if (h.completedToday) {
        const list = map.get(todayISO) || [];
        if (!list.some((item) => item.habitId === h.id)) {
          list.push({ habitId: h.id, habitName: h.name });
        }
        map.set(todayISO, list);
      }
    });

    return map;
  }, [habits, selectedHabitFilter, todayISO]);

  // Compute total habits count for selected year
  const totalHabitsInYear = useMemo(() => {
    let sum = 0;
    habitsByDate.forEach((list, dateStr) => {
      if (dateStr.startsWith(String(selectedYear))) {
        sum += list.length;
      }
    });
    return sum;
  }, [habitsByDate, selectedYear]);

  const handleCellHover = (e: React.MouseEvent, details: CellDetails) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    setHoveredCell(details);
  };

  const handleCellLeave = () => {
    setHoveredCell(null);
    setMousePos(null);
  };

  const handleAddSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSubmitting || !onAddHabit) return;

    setIsSubmitting(true);
    try {
      await onAddHabit(inputText.trim());
      setInputText("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (habit: HabitItem) => {
    setEditingHabitId(habit.id);
    setEditingText(habit.name);
  };

  const cancelEditing = () => {
    setEditingHabitId(null);
    setEditingText("");
  };

  const saveEditing = async (habitId: string) => {
    if (!editingText.trim()) {
      cancelEditing();
      return;
    }
    if (onUpdateHabit) {
      await onUpdateHabit(habitId, {
        name: editingText.trim(),
      });
    }
    setEditingHabitId(null);
    setEditingText("");
  };

  return (
    <div className="glass-card rounded-2xl border border-white/10 p-3.5 space-y-3 shadow-xl">
      {/* Level 1 Section Header */}
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-1.5">
              <span>Habit Tracker</span>
              <span className="text-amber-400">🔥</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm">
              Database: Habit
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-medium">
            Track daily streaks and habits
          </p>
        </div>

        <div className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-extrabold text-xs shrink-0 shadow-sm">
          {habits.filter((h) => h.completedToday).length} / {habits.length} Done Today
        </div>
      </div>

      {/* GitHub Official Profile Contribution Graph Section (Main Amber Theme) */}
      <div className="space-y-2">
        {/* Header Bar: Total Count Title + Habit Filter */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-sans">
          <h3 className="text-sm font-normal text-zinc-200 tracking-normal">
            <span className="font-semibold text-amber-400">{totalHabitsInYear} habits</span> in {selectedYear}
          </h3>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-zinc-400 font-medium">Filter:</span>
            <select
              value={selectedHabitFilter}
              onChange={(e) => setSelectedHabitFilter(e.target.value)}
              className="bg-[#161b22] text-amber-200 text-[11px] font-semibold border border-amber-500/30 rounded-md px-2 py-0.5 outline-none cursor-pointer hover:border-amber-400 transition-all max-w-[130px] truncate"
            >
              <option value="ALL">All Habits</option>
              {habits.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Main Grid & Year Sidebar Container */}
        <div className="flex items-start gap-3">
          {/* Left: GitHub Official Graph Border Box */}
          <div className="flex-1 bg-[#0d1117] rounded-md border border-amber-500/20 p-2.5 space-y-2 relative overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
              <div className="inline-flex flex-col gap-1 min-w-max">
                {/* Month Header Labels */}
                <div className="flex items-center text-[10px] text-zinc-400 font-sans h-4 pl-7">
                  {weeksMatrix.map((w, idx) => (
                    <div key={idx} className="w-[12px] text-center shrink-0">
                      {w.monthLabel ? (
                        <span className="text-amber-200/70 font-medium block text-left">
                          {w.monthLabel}
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>

                {/* 7-Row Grid with Mon, Wed, Fri Labels */}
                <div className="flex items-start gap-1">
                  {/* Day Labels (Mon, Wed, Fri) */}
                  <div className="flex flex-col gap-[3px] text-[9px] text-zinc-400 font-sans shrink-0 pr-1.5 select-none pt-[11px]">
                    <div className="h-[10px] flex items-center">Mon</div>
                    <div className="h-[10px] flex items-center opacity-0">Tue</div>
                    <div className="h-[10px] flex items-center">Wed</div>
                    <div className="h-[10px] flex items-center opacity-0">Thu</div>
                    <div className="h-[10px] flex items-center">Fri</div>
                  </div>

                  {/* Week Columns */}
                  <div className="flex items-center gap-[3px]">
                    {weeksMatrix.map((w) => (
                      <div key={w.weekIndex} className="flex flex-col gap-[3px]">
                        {Array.from({ length: 7 }).map((_, dayOfWeek) => {
                          const dayData = w.days.find((d) => d.dayOfWeek === dayOfWeek);
                          if (!dayData) {
                            return <div key={dayOfWeek} className="w-[10px] h-[10px] rounded-[2px] opacity-0" />;
                          }

                          const completedList = habitsByDate.get(dayData.dateStr) || [];
                          const count = completedList.length;
                          const isToday = dayData.dateStr === todayISO;

                          // Main Amber / Gold Hex Color Palette
                          let hexBg = "#161b22"; // Level 0
                          let hexBorder = "#21262d";
                          if (count === 1) {
                            hexBg = "#451a03"; // Level 1 (Dark Amber)
                            hexBorder = "#78350f";
                          } else if (count === 2) {
                            hexBg = "#78350f"; // Level 2 (Medium Amber)
                            hexBorder = "#b45309";
                          } else if (count === 3) {
                            hexBg = "#d97706"; // Level 3 (Warm Amber)
                            hexBorder = "#f59e0b";
                          } else if (count >= 4) {
                            hexBg = "#f59e0b"; // Level 4 (Vibrant Gold)
                            hexBorder = "#fbbf24";
                          }

                          const formattedDate = dayData.dateObj.toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          });

                          const cellDetails: CellDetails = {
                            dateStr: dayData.dateStr,
                            formattedDate,
                            completedHabitNames: completedList.map((item) => item.habitName),
                            count,
                          };

                          return (
                            <div
                              key={dayData.dateStr}
                              onMouseEnter={(e) => handleCellHover(e, cellDetails)}
                              onMouseMove={(e) => handleCellHover(e, cellDetails)}
                              onMouseLeave={handleCellLeave}
                              style={{
                                backgroundColor: hexBg,
                                borderColor: hexBorder,
                              }}
                              className={`w-[10px] h-[10px] rounded-[2px] border transition-all cursor-pointer hover:scale-125 hover:z-10 ${
                                isToday ? "ring-1 ring-amber-400" : ""
                              }`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Official GitHub Footer Line (Amber Scale Legend) */}
            <div className="flex items-center justify-between text-[11px] text-zinc-400 font-sans pt-2 border-t border-white/5">
              <a
                href="#learn"
                onClick={(e) => e.preventDefault()}
                className="text-zinc-400 hover:text-amber-400 transition-all text-[11px]"
              >
                Learn how we count contributions
              </a>

              {/* Main Amber Color Scale Legend */}
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                <span>Less</span>
                <span className="w-[10px] h-[10px] rounded-[2px] bg-[#161b22] border border-[#21262d]" />
                <span className="w-[10px] h-[10px] rounded-[2px] bg-[#451a03]" />
                <span className="w-[10px] h-[10px] rounded-[2px] bg-[#78350f]" />
                <span className="w-[10px] h-[10px] rounded-[2px] bg-[#d97706]" />
                <span className="w-[10px] h-[10px] rounded-[2px] bg-[#f59e0b]" />
                <span>More</span>
              </div>
            </div>
          </div>

          {/* Right: Year Selector Buttons Sidebar */}
          <div className="flex flex-col gap-1 shrink-0 pt-1">
            {AVAILABLE_YEARS.map((yr) => {
              const isActive = selectedYear === yr;
              return (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setSelectedYear(yr)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-amber-500 text-zinc-950 font-bold shadow-md shadow-amber-500/30"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                  }`}
                >
                  {yr}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dynamic Live Mouse-Tracking Popup (Floating at Top-Left of Cursor) */}
      <AnimatePresence>
        {hoveredCell && mousePos && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.12 }}
            style={{
              position: "fixed",
              left: `${mousePos.x - 12}px`,
              top: `${mousePos.y - 12}px`,
              transform: "translate(-100%, -100%)",
            }}
            className="z-[9999] pointer-events-none p-2.5 rounded-xl bg-[#0d1117] border border-amber-500/40 backdrop-blur-2xl shadow-2xl space-y-1.5 max-w-[240px]"
          >
            <div className="flex items-center justify-between gap-2 text-xs font-extrabold text-white border-b border-white/10 pb-1">
              <span>📅 {hoveredCell.formattedDate}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                {hoveredCell.count} done
              </span>
            </div>

            {hoveredCell.completedHabitNames.length > 0 ? (
              <div className="space-y-1 pt-0.5">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Habits Completed:
                </span>
                <div className="flex flex-col gap-1">
                  {hoveredCell.completedHabitNames.map((name, idx) => (
                    <div
                      key={idx}
                      className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-200 flex items-center gap-1.5"
                    >
                      <span className="text-amber-400 font-bold">✓</span>
                      <span className="truncate">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-zinc-400 italic pt-0.5">
                No habits recorded on this date.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Habit List Feed — 20% Compact Padding */}
      {isLoading ? (
        <div className="py-8 text-center text-zinc-500 text-xs">
          <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-1.5" />
          Loading habits...
        </div>
      ) : habits.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-8 text-center space-y-1.5 rounded-xl border border-white/5 bg-zinc-950/40"
        >
          <p className="text-zinc-300 font-semibold text-xs">
            No habits tracked yet.
          </p>
          <p className="text-[11px] text-zinc-500">
            Type a new habit below to build your streak!
          </p>
        </motion.div>
      ) : (
        <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
          <AnimatePresence mode="popLayout">
            {habits.map((habit) => {
              const isDone = Boolean(habit.completedToday);
              const isEditingThis = editingHabitId === habit.id;

              return (
                <motion.div
                  key={habit.id}
                  layout
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className={`group relative flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    isEditingThis
                      ? "bg-zinc-950 border-amber-400/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/50"
                      : isDone
                      ? "glass-subtle border-white/5 opacity-80 bg-zinc-950/40"
                      : "glass-card border-white/10 hover:border-amber-500/30 bg-zinc-900/60 shadow-sm"
                  }`}
                >
                  {isEditingThis ? (
                    /* Mobile-Friendly Full-Width Inline Edit Row (No Overlap) */
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full min-w-0">
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEditing(habit.id);
                          if (e.key === "Escape") cancelEditing();
                        }}
                        autoFocus
                        placeholder="Edit habit name..."
                        className="flex-1 min-w-0 bg-zinc-900 border border-amber-400/80 rounded-xl px-3 py-1.5 text-lg text-white outline-none focus:ring-1 focus:ring-amber-400 transition-all font-bold"
                      />
                      <div className="flex items-center justify-end gap-1.5 shrink-0">
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => saveEditing(habit.id)}
                          title="Save inline edit (Enter)"
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-zinc-950 font-extrabold text-xs hover:bg-emerald-400 transition-all cursor-pointer shadow-sm flex items-center gap-1"
                        >
                          <span>✓</span> Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          title="Cancel edit (Esc)"
                          className="px-2.5 py-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer text-xs font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between min-w-0 w-full">
                      <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                        <button
                          type="button"
                          onClick={() => onToggleHabit?.(habit.id)}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                            isDone
                              ? "bg-amber-500 border-amber-400 text-zinc-950 shadow-sm"
                              : "border-white/20 hover:border-amber-400 bg-white/5"
                          }`}
                        >
                          {isDone && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                          )}
                        </button>

                        <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                          {/* Clickable Habit Name to Edit Inline (h3 / item title level) */}
                          <span
                            onClick={() => startEditing(habit)}
                            title="Click to edit habit name inline"
                            className={`text-lg font-bold transition-all break-words whitespace-normal leading-snug cursor-pointer hover:text-amber-300 ${
                              isDone
                                ? "line-through text-zinc-400 font-normal"
                                : "text-zinc-100"
                            }`}
                          >
                            {habit.name}
                          </span>

                          {/* Streak Badge (text-sm badge level) */}
                          <span className="px-2.5 py-0.5 rounded-full text-sm font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300 shrink-0 flex items-center gap-1">
                            <span>🔥</span> {habit.streak} d
                          </span>
                        </div>
                      </div>

                      {/* Right Actions: Default Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => startEditing(habit)}
                          title="Edit habit inline"
                          className="p-1 rounded-lg text-zinc-500 hover:text-amber-300 hover:bg-amber-500/10 transition-all cursor-pointer"
                        >
                          ✏️
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteHabit?.(habit.id)}
                          title="Delete habit"
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Dedicated Section Input Box for Habits */}
      {onAddHabit && (
        <form onSubmit={handleAddSubmit} className="pt-2 border-t border-white/5 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold text-amber-400 uppercase tracking-wider">
            <span>Add New Habit:</span>
          </div>

          <div className="flex items-center gap-2 bg-zinc-900/80 p-1.5 rounded-xl border border-white/10 focus-within:border-amber-500/50 transition-all">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Add daily habit (e.g. Workout, Drink 2L water)..."
              disabled={isSubmitting}
              className="flex-1 bg-transparent border-none outline-none text-xs text-white placeholder-zinc-500 min-w-0 px-2"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isSubmitting}
              className="shrink-0 p-1.5 rounded-lg bg-amber-500 text-zinc-950 font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-amber-400 transition-all cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.4 20.4l17.45-7.48a1 1 0 000-1.84L3.4 3.6a.996.996 0 00-1.41.91v4.99c0 .5.37.92.87.99L14 12l-11.14 1.5c-.5.07-.87.49-.87.99v4.99c0 .65.65 1.13 1.41.92z" />
              </svg>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

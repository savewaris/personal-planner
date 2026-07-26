"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TaskItem } from "./TaskCard";

interface DashboardMiniCalendarProps {
  tasks: TaskItem[];
  onOpenAddModalWithDate?: (dateStr: string) => void;
}

export const DashboardMiniCalendar: React.FC<DashboardMiniCalendarProps> = ({
  tasks,
  onOpenAddModalWithDate,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [hoveredDateStr, setHoveredDateStr] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });

  const formatLocalDateStr = (y: number, m: number, d: number) => {
    const mm = String(m + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  };

  const calendarGrid = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startingDayOfWeek = firstDayOfMonth.getDay();
    const totalDaysInMonth = lastDayOfMonth.getDate();

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const pDay = prevMonthLastDay - i;
      const prevMonthIdx = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      days.push({ dateStr: formatLocalDateStr(prevYear, prevMonthIdx, pDay), dayNum: pDay, isCurrentMonth: false, isToday: false });
    }

    const now = new Date();
    const todayStr = formatLocalDateStr(now.getFullYear(), now.getMonth(), now.getDate());
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = formatLocalDateStr(year, month, d);
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    const remainingCells = (7 - (days.length % 7)) % 7;
    for (let n = 1; n <= remainingCells; n++) {
      const nextMonthIdx = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      days.push({ dateStr: formatLocalDateStr(nextYear, nextMonthIdx, n), dayNum: n, isCurrentMonth: false, isToday: false });
    }

    return days;
  }, [year, month]);

  const tasksByDateMap = useMemo(() => {
    const map = new Map<string, TaskItem[]>();
    tasks.forEach((t) => {
      if (t.dueDate) {
        const dStr = t.dueDate.split("T")[0];
        if (!map.has(dStr)) map.set(dStr, []);
        map.get(dStr)!.push(t);
      }
    });
    return map;
  }, [tasks]);

  const selectedDateTasks = useMemo(() => {
    if (!selectedDateStr) return [];
    return tasksByDateMap.get(selectedDateStr) || [];
  }, [selectedDateStr, tasksByDateMap]);

  const hoveredDateTasks = useMemo(() => {
    if (!hoveredDateStr) return [];
    return tasksByDateMap.get(hoveredDateStr) || [];
  }, [hoveredDateStr, tasksByDateMap]);

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

  return (
    <div className="glass-card p-4 sm:p-5 rounded-2xl border border-white/10 space-y-3 relative overflow-visible h-full flex flex-col justify-between">
      {/* Header Controls */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white tracking-tight">{monthName}</span>
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 transition-all cursor-pointer text-xs"
          >
            ◀
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 transition-all cursor-pointer text-xs"
          >
            ▶
          </button>
        </div>
      </div>

      {/* Weekday Labels Header */}
      <div className="grid grid-cols-7 text-center text-[10px] font-bold text-zinc-400">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Calendar Grid Container */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {calendarGrid.map((cell, idx) => {
          const dayTasks = tasksByDateMap.get(cell.dateStr) || [];
          const hasTasks = dayTasks.length > 0;
          const isSelected = selectedDateStr === cell.dateStr;
          const isHovered = hoveredDateStr === cell.dateStr;

          return (
            <div key={`${cell.dateStr}-${idx}`} className="relative">
              <button
                type="button"
                onMouseEnter={() => setHoveredDateStr(cell.dateStr)}
                onMouseLeave={() => setHoveredDateStr(null)}
                onClick={() => setSelectedDateStr(cell.dateStr)}
                className={`w-full h-7 rounded-lg text-xs font-semibold flex items-center justify-center relative transition-all cursor-pointer ${
                  cell.isCurrentMonth
                    ? cell.isToday
                      ? "bg-indigo-600 text-white font-black shadow-md shadow-indigo-600/40 ring-1 ring-indigo-400"
                      : isSelected
                      ? "bg-indigo-500/30 border border-indigo-400 text-white"
                      : "text-zinc-200 hover:bg-white/10 hover:scale-110"
                    : "text-zinc-600 opacity-40"
                }`}
              >
                <span>{cell.dayNum}</span>
                {hasTasks && !cell.isToday && (
                  <span className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>

              {/* Direct Cell-Anchored Hover Tooltip with Pointer Arrow */}
              <AnimatePresence>
                {isHovered && !selectedDateStr && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-52 p-3 rounded-xl bg-zinc-950 border border-indigo-500/40 shadow-2xl shadow-indigo-500/25 backdrop-blur-xl pointer-events-none space-y-1.5 text-left"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-1">
                      <span className="text-[11px] font-bold text-white flex items-center gap-1">
                        📅 {cell.dateStr}
                      </span>
                      <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/20 px-1.5 py-0.5 rounded">
                        {hoveredDateTasks.length} task{hoveredDateTasks.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    {hoveredDateTasks.length === 0 ? (
                      <p className="text-[10px] text-zinc-400 italic">No tasks scheduled for this day.</p>
                    ) : (
                      <div className="space-y-1 max-h-24 overflow-hidden">
                        {hoveredDateTasks.slice(0, 3).map((t) => (
                          <div key={t.id} className="flex items-center justify-between gap-1 text-[10px]">
                            <span className="text-zinc-200 truncate font-medium">{t.title}</span>
                            <span className="text-[9px] text-zinc-400 font-bold px-1 rounded bg-white/5 shrink-0">
                              {t.status}
                            </span>
                          </div>
                        ))}
                        {hoveredDateTasks.length > 3 && (
                          <p className="text-[9px] text-indigo-400 font-bold">+ {hoveredDateTasks.length - 3} more</p>
                        )}
                      </div>
                    )}

                    {/* Pointer Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-indigo-500/40" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Date Preview Popover Modal */}
      <AnimatePresence>
        {selectedDateStr && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="w-full max-w-sm glass-card p-5 border border-white/15 rounded-2xl space-y-4 bg-zinc-950 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    📅 {selectedDateStr}
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    {selectedDateTasks.length} task{selectedDateTasks.length === 1 ? "" : "s"} scheduled
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDateStr(null)}
                  className="text-zinc-400 hover:text-white transition-colors cursor-pointer text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Tasks List */}
              {selectedDateTasks.length === 0 ? (
                <div className="py-6 text-center border border-white/10 bg-white/5 rounded-xl">
                  <p className="text-xs text-zinc-400">No tasks due on this date.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedDateTasks.map((t) => (
                    <div
                      key={t.id}
                      className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2"
                    >
                      <span className="text-xs text-zinc-200 font-medium truncate">{t.title}</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedDateStr(null)}
                  className="flex-1 py-2 rounded-xl border border-white/10 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Close
                </button>
                {onOpenAddModalWithDate && (
                  <button
                    type="button"
                    onClick={() => {
                      const dateToPass = selectedDateStr;
                      setSelectedDateStr(null);
                      onOpenAddModalWithDate(dateToPass);
                    }}
                    className="flex-1 btn-premium py-2 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    + Add Task for Date
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

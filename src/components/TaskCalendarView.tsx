"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { TaskItem } from "./TaskCard";

interface TaskCalendarViewProps {
  tasks: TaskItem[];
  onStatusChange: (id: string, newStatus: string) => void;
  onDeleteTask: (id: string) => void;
  onOpenAddModal: (status?: string, dueDate?: string) => void;
}

export const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({
  tasks,
  onStatusChange,
  onDeleteTask,
  onOpenAddModal,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Compute days for calendar grid
  const calendarGrid = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun
    const totalDaysInMonth = lastDayOfMonth.getDate();

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

    // Previous month padding days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const pDay = prevMonthLastDay - i;
      const pDate = new Date(year, month - 1, pDay);
      const dateStr = pDate.toISOString().split("T")[0];
      days.push({ dateStr, dayNum: pDay, isCurrentMonth: false, isToday: false });
    }

    // Current month days
    const todayStr = new Date().toISOString().split("T")[0];
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const cDate = new Date(year, month, d);
      // Format YYYY-MM-DD
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Next month padding days to complete 35 or 42 grid cells
    const remainingCells = (7 - (days.length % 7)) % 7;
    for (let n = 1; n <= remainingCells; n++) {
      const nDate = new Date(year, month + 1, n);
      const dateStr = nDate.toISOString().split("T")[0];
      days.push({ dateStr, dayNum: n, isCurrentMonth: false, isToday: false });
    }

    return days;
  }, [year, month]);

  // Group tasks by date string (YYYY-MM-DD)
  const tasksByDate = useMemo(() => {
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

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const todayMonth = () => setCurrentDate(new Date());

  return (
    <div className="glass-card rounded-2xl border border-white/10 p-4 sm:p-6 space-y-4">
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-white tracking-tight">{monthName}</h3>
          <button
            type="button"
            onClick={todayMonth}
            className="px-2.5 py-1 text-xs font-semibold text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-lg hover:bg-indigo-500/20 transition-all cursor-pointer"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 transition-all cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>

          <button
            type="button"
            onClick={nextMonth}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 transition-all cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Weekday Labels Header */}
      <div className="grid grid-cols-7 text-center text-xs font-semibold text-zinc-400 py-1 border-b border-white/5">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {calendarGrid.map((cell) => {
          const dayTasks = tasksByDate.get(cell.dateStr) || [];

          return (
            <div
              key={cell.dateStr}
              className={`min-h-[90px] sm:min-h-[110px] p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between transition-all group ${
                cell.isCurrentMonth
                  ? "bg-zinc-900/60 border-white/5 hover:border-white/20"
                  : "bg-zinc-950/40 border-transparent opacity-40"
              } ${cell.isToday ? "ring-2 ring-indigo-500 ring-offset-1 ring-offset-zinc-950" : ""}`}
            >
              {/* Day Cell Header */}
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className={cell.isToday ? "text-indigo-400 font-bold" : "text-zinc-400"}>
                  {cell.dayNum}
                </span>

                {cell.isCurrentMonth && (
                  <button
                    type="button"
                    onClick={() => onOpenAddModal("TODO", cell.dateStr)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-500 hover:text-indigo-300 transition-all cursor-pointer"
                    title={`Add task for ${cell.dateStr}`}
                  >
                    +
                  </button>
                )}
              </div>

              {/* Tasks List inside Cell */}
              <div className="space-y-1 my-1 overflow-y-auto max-h-16 no-scrollbar">
                {dayTasks.map((t) => {
                  const isDone = t.status === "DONE";
                  const todayStr = new Date().toISOString().split("T")[0];
                  const isOverdue = !isDone && t.dueDate && t.dueDate < todayStr;

                  return (
                    <div
                      key={t.id}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold truncate flex items-center justify-between gap-1 border ${
                        isDone
                          ? "bg-zinc-800/80 text-zinc-500 border-zinc-700 line-through"
                          : isOverdue
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold animate-pulse"
                          : "bg-indigo-500/20 text-indigo-200 border-indigo-500/30"
                      }`}
                      title={t.title}
                    >
                      <span className="truncate">{t.title}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStatusChange(t.id, isDone ? "TODO" : "DONE");
                        }}
                        className="hover:scale-125 transition-transform shrink-0"
                      >
                        {isDone ? "✓" : "○"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

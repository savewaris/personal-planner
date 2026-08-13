"use client";

import React, { useState, useMemo } from "react";
import { TaskItem } from "./TaskCard";

interface TaskCalendarViewProps {
  tasks: TaskItem[];
  onStatusChange: (id: string, newStatus: string) => void;
  onDeleteTask: (id: string) => void;
  onOpenAddModal: (dateStr: string) => void;
  onSelectTask?: (task: TaskItem) => void;
}

export const TaskCalendarView: React.FC<TaskCalendarViewProps> = ({
  tasks,
  onStatusChange,
  onOpenAddModal,
  onSelectTask,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  // Timezone-safe local date string formatting (YYYY-MM-DD)
  const formatLocalDateStr = (y: number, m: number, d: number) => {
    const mm = String(m + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  };

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
      const prevMonthIdx = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = formatLocalDateStr(prevYear, prevMonthIdx, pDay);
      days.push({ dateStr, dayNum: pDay, isCurrentMonth: false, isToday: false });
    }

    // Current month days
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

    // Next month padding days to complete 35 or 42 grid cells
    const remainingCells = (7 - (days.length % 7)) % 7;
    for (let n = 1; n <= remainingCells; n++) {
      const nextMonthIdx = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = formatLocalDateStr(nextYear, nextMonthIdx, n);
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
    <div className="glass-card rounded-2xl border border-slate-200 p-4 sm:p-6 space-y-4 bg-white shadow-sm">
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">{monthName}</h3>
          <button
            type="button"
            onClick={todayMonth}
            className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-all cursor-pointer shadow-xs"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer shadow-xs"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>

          <button
            type="button"
            onClick={nextMonth}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer shadow-xs"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Weekday Labels Header */}
      <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-500 py-1 border-b border-slate-200">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      {/* Calendar Grid — Click Anywhere on Date Box to Create Task */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {calendarGrid.map((cell, idx) => {
          const dayTasks = tasksByDate.get(cell.dateStr) || [];

          return (
            <div
              key={`${cell.dateStr}-${idx}`}
              onClick={() => onOpenAddModal(cell.dateStr)}
              className={`min-h-[95px] sm:min-h-[115px] p-1.5 sm:p-2 rounded-xl border flex flex-col justify-between transition-all group cursor-pointer ${
                cell.isCurrentMonth
                  ? "bg-slate-50/80 border-slate-200 hover:border-indigo-300 hover:bg-slate-100 hover:shadow-md"
                  : "bg-slate-100/50 border-transparent opacity-50 hover:opacity-75 hover:border-slate-200"
              } ${cell.isToday ? "ring-2 ring-indigo-600 ring-offset-1 ring-offset-slate-50" : ""}`}
            >
              {/* Day Cell Header */}
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className={cell.isToday ? "text-indigo-600 font-bold" : "text-slate-600"}>
                  {cell.dayNum}
                </span>

                <span
                  className="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 rounded text-[10px] font-bold text-indigo-700 bg-indigo-100 border border-indigo-200 transition-all"
                  title={`Click to add task for ${cell.dateStr}`}
                >
                  + Add
                </span>
              </div>

              {/* Tasks List inside Cell */}
              <div className="space-y-1 my-1 overflow-y-auto max-h-20 no-scrollbar">
                {dayTasks.map((t) => {
                  const isDone = t.status === "DONE";
                  const now = new Date();
                  const todayStr = formatLocalDateStr(now.getFullYear(), now.getMonth(), now.getDate());
                  const isOverdue = !isDone && t.dueDate && t.dueDate < todayStr;

                  return (
                    <div
                      key={t.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectTask) onSelectTask(t);
                      }}
                      className={`px-1.5 py-1 rounded text-[10px] font-semibold truncate flex items-center justify-between gap-1 border transition-all hover:scale-[1.02] cursor-pointer ${
                        isDone
                          ? "bg-slate-200 text-slate-500 border-slate-300 line-through"
                          : isOverdue
                          ? "bg-rose-100 text-rose-800 border-rose-300 font-bold"
                          : "bg-indigo-50 text-indigo-900 border-indigo-200 hover:border-indigo-400"
                      }`}
                      title={`${t.title} (${t.priority} priority)`}
                    >
                      <div className="flex items-center gap-1 min-w-0 truncate">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            t.priority === "HIGH"
                              ? "bg-rose-500"
                              : t.priority === "MEDIUM"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                        />
                        <span className="truncate">{t.title}</span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStatusChange(t.id, isDone ? "TODO" : "DONE");
                        }}
                        className="hover:scale-125 transition-transform shrink-0 cursor-pointer text-slate-500 hover:text-indigo-700"
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

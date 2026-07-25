"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

interface HabitLogItem {
  id?: string;
  date: string;
  completed: boolean;
}

interface HabitHeatmapProps {
  logs: HabitLogItem[];
}

export const HabitHeatmap: React.FC<HabitHeatmapProps> = ({ logs }) => {
  // Generate 52 weeks (364 days) leading up to today
  const calendarDays = useMemo(() => {
    const days: { dateStr: string; intensity: number; isToday: boolean }[] = [];
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Build map of completion counts per date
    const logMap = new Map<string, number>();
    logs.forEach((log) => {
      if (log.completed) {
        const dateKey = typeof log.date === "string" ? log.date.split("T")[0] : log.date;
        logMap.set(dateKey, (logMap.get(dateKey) || 0) + 1);
      }
    });

    // 52 weeks * 7 days = 364 days back
    for (let i = 181; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const count = logMap.get(dateStr) || 0;

      // Intensity level 0-4
      const intensity = count >= 3 ? 4 : count === 2 ? 3 : count === 1 ? 2 : 0;
      days.push({
        dateStr,
        intensity,
        isToday: dateStr === todayStr,
      });
    }

    return days;
  }, [logs]);

  const intensityColors = [
    "bg-zinc-900 border-white/5", // 0: no completion
    "bg-indigo-950/60 border-indigo-800/40", // 1: light
    "bg-indigo-600/60 border-indigo-500/50", // 2: medium
    "bg-indigo-500 border-indigo-400", // 3: high
    "bg-gradient-to-br from-indigo-400 to-purple-400 border-white/40 shadow-indigo-500/50 shadow-sm", // 4: max
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-zinc-400 font-semibold">
        <span>6-Month Activity Heatmap</span>
        <div className="flex items-center gap-1 text-[10px]">
          <span>Less</span>
          <span className="w-2.5 h-2.5 rounded bg-zinc-900 border border-white/10" />
          <span className="w-2.5 h-2.5 rounded bg-indigo-950/60 border border-indigo-800/40" />
          <span className="w-2.5 h-2.5 rounded bg-indigo-600/60 border border-indigo-500/50" />
          <span className="w-2.5 h-2.5 rounded bg-indigo-500 border border-indigo-400" />
          <span>More</span>
        </div>
      </div>

      {/* Grid: 26 columns x 7 rows */}
      <div className="overflow-x-auto no-scrollbar pb-1">
        <div className="grid grid-rows-7 grid-flow-col gap-1 w-max">
          {calendarDays.map((day) => (
            <motion.div
              key={day.dateStr}
              whileHover={{ scale: 1.4, zIndex: 10 }}
              className={`w-3 h-3 rounded-sm border ${intensityColors[day.intensity]} ${
                day.isToday ? "ring-2 ring-emerald-400 ring-offset-1 ring-offset-zinc-950" : ""
              } transition-all cursor-pointer`}
              title={`${day.dateStr}: ${day.intensity > 0 ? "Completed habits" : "No completion"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

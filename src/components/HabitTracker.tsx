"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { usePlannerStore } from "@/context/PlannerStoreContext";
import { HabitStreakVisualizer } from "./HabitStreakVisualizer";
import { HabitHeatmap } from "./HabitHeatmap";
import { CreateHabitDrawer } from "./CreateHabitDrawer";

export const HabitTracker: React.FC<{ isModalOpenExternal?: boolean; onCloseModalExternal?: () => void }> = ({
  isModalOpenExternal = false,
  onCloseModalExternal,
}) => {
  const { habits, isLoading, toggleHabit, deleteHabit, stats } = usePlannerStore();

  // Drawer Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sync external modal trigger
  useEffect(() => {
    if (isModalOpenExternal) setIsModalOpen(true);
  }, [isModalOpenExternal]);

  const allLogs = useMemo(() => {
    return habits.flatMap((h) => h.logs || []);
  }, [habits]);

  const completedTodayCount = useMemo(() => {
    return habits.filter((h) => h.completedToday).length;
  }, [habits]);

  return (
    <div className="glass-card p-6 border border-white/10 rounded-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Habit Tracker</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {completedTodayCount} of {habits.length} habits completed today
          </p>
        </div>

        <div className="flex items-center gap-4">
          <HabitStreakVisualizer streak={stats.maxStreak} />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="btn-premium flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Habit
          </motion.button>
        </div>
      </div>

      {/* 6-Month Heatmap Grid */}
      <HabitHeatmap logs={allLogs} />

      {/* Daily Checklist */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
          Daily Checklist
        </h3>

        {isLoading ? (
          <div className="py-8 flex justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
          </div>
        ) : habits.length === 0 ? (
          <div className="py-8 text-center border-2 border-dashed border-white/20 hover:border-indigo-500/40 rounded-xl transition-all">
            <p className="text-xs text-zinc-500">No habits added yet.</p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-2 text-xs text-indigo-400 hover:underline cursor-pointer font-semibold"
            >
              + Create Your First Habit
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {habits.map((habit) => (
              <motion.div
                key={habit.id}
                whileHover={{ x: 3 }}
                className="p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 flex items-center justify-between gap-3 transition-all group"
              >
                {/* Left: Checkbox + Name */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => toggleHabit(habit.id)}
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                      habit.completedToday
                        ? "bg-gradient-to-r from-emerald-500 to-teal-400 border-emerald-400 text-black shadow-lg shadow-emerald-500/25"
                        : "border-zinc-700 hover:border-indigo-400 bg-zinc-900"
                    }`}
                  >
                    {habit.completedToday && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 stroke-[3]" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>

                  <span className={`text-sm font-semibold truncate ${habit.completedToday ? "line-through text-zinc-500" : "text-zinc-100"}`}>
                    {habit.name}
                  </span>
                </div>

                {/* Right: Streak + Delete */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 flex items-center gap-1">
                    🔥 {habit.streak}d
                  </span>

                  <button
                    type="button"
                    onClick={() => deleteHabit(habit.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 transition-all cursor-pointer rounded-lg hover:bg-white/5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Habit Standalone Drawer */}
      <CreateHabitDrawer
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          if (onCloseModalExternal) onCloseModalExternal();
        }}
      />
    </div>
  );
};

"use client";

import React from "react";
import { motion } from "framer-motion";

interface HabitStreakVisualizerProps {
  streak: number;
}

export const HabitStreakVisualizer: React.FC<HabitStreakVisualizerProps> = ({ streak }) => {
  // Flame color intensity based on streak level
  const flameColor =
    streak >= 30
      ? "from-amber-400 via-orange-500 to-red-600 shadow-orange-500/50"
      : streak >= 7
      ? "from-amber-400 to-orange-500 shadow-amber-500/40"
      : streak > 0
      ? "from-amber-300 to-yellow-500 shadow-yellow-500/30"
      : "from-zinc-600 to-zinc-700 shadow-none";

  return (
    <div className="flex items-center gap-2">
      <motion.div
        animate={{
          scale: streak > 0 ? [1, 1.12, 1] : 1,
          rotate: streak > 0 ? [-2, 2, -2] : 0,
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`w-9 h-9 rounded-xl bg-gradient-to-br ${flameColor} flex items-center justify-center shadow-lg text-white font-black text-sm border border-white/20`}
      >
        🔥
      </motion.div>
      <div>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-black text-white">{streak}</span>
          <span className="text-xs font-semibold text-zinc-400">day streak</span>
        </div>
        <p className="text-[10px] font-medium text-zinc-500">
          {streak >= 30
            ? "Unstoppable Flame! 🔥"
            : streak >= 7
            ? "On Fire! ⚡"
            : streak > 0
            ? "Streak Active"
            : "Start your streak today"}
        </p>
      </div>
    </div>
  );
};

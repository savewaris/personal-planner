"use client";

import React from "react";
import { motion } from "framer-motion";

interface FlameStreakBadgeProps {
  streak: number;
  size?: "sm" | "md";
}

export const FlameStreakBadge: React.FC<FlameStreakBadgeProps> = ({ streak, size = "sm" }) => {
  const isHot = streak >= 7;
  const isActive = streak > 0;

  const bgGradient = isHot
    ? "from-amber-500/25 via-orange-500/30 to-rose-500/25 border-orange-500/50 text-orange-200 shadow-orange-500/20"
    : isActive
    ? "from-amber-500/20 to-yellow-500/20 border-amber-500/40 text-amber-300 shadow-amber-500/15"
    : "from-zinc-800/80 to-zinc-900/80 border-zinc-700/60 text-zinc-400 shadow-none";

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`relative inline-flex items-center gap-1 rounded-xl border font-black shadow-md backdrop-blur-sm transition-all ${bgGradient} ${
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
      }`}
    >
      <motion.span
        animate={isActive ? { scale: [1, 1.15, 1], rotate: [-3, 3, -3] } : {}}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        className="text-sm leading-none drop-shadow-sm select-none"
      >
        🔥
      </motion.span>

      <span className="tracking-tight leading-none">
        {streak}<span className="text-[10px] font-bold opacity-80 ml-0.5">d</span>
      </span>
    </motion.div>
  );
};

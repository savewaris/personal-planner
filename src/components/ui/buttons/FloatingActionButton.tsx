"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FloatingActionButtonProps {
  onNewTask: () => void;
  onNewHabit: () => void;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onNewTask,
  onNewHabit,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.9 }}
            className="flex flex-col gap-2 mb-3 items-end"
          >
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onNewTask();
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-card bg-slate-900/90 text-slate-100 text-xs font-semibold shadow-lg hover:bg-slate-800 transition-all cursor-pointer border border-white/10"
            >
              <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New Task
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onNewHabit();
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass-card bg-slate-900/90 text-slate-100 text-xs font-semibold shadow-lg hover:bg-slate-800 transition-all cursor-pointer border border-white/10"
            >
              <span className="text-orange-400">🔥</span>
              New Habit
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full btn-glow flex items-center justify-center text-white shadow-xl shadow-indigo-500/30 cursor-pointer"
        aria-label="Quick Actions"
      >
        <motion.svg
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="w-7 h-7"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </motion.svg>
      </motion.button>
    </div>
  );
};

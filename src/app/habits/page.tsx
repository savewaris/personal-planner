"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { HabitTracker } from "@/components/HabitTracker";
import { CommandPalette } from "@/components/CommandPalette";
import { QuickAddFAB } from "@/components/QuickAddFAB";

export default function HabitsPage() {
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);

  // Global Cmd+K Keyboard Shortcut Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="border-b border-white/5 pb-6"
      >
        <h1 className="text-3xl font-black tracking-tight text-white">
          Habit <span className="gradient-text">Tracker</span>
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Build consistency, track daily routines, and maintain your streaks.
        </p>
      </motion.div>

      {/* Main Habit Tracker Component */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <HabitTracker
          isModalOpenExternal={isHabitModalOpen}
          onCloseModalExternal={() => setIsHabitModalOpen(false)}
        />
      </motion.div>

      {/* Command Palette Overlay */}
      <CommandPalette
        isOpen={isCmdOpen}
        onClose={() => setIsCmdOpen(false)}
        onOpenTaskModal={() => setIsTaskModalOpen(true)}
        onOpenHabitModal={() => setIsHabitModalOpen(true)}
      />

      {/* Floating Action Button */}
      <QuickAddFAB
        onOpenTaskModal={() => setIsTaskModalOpen(true)}
        onOpenHabitModal={() => setIsHabitModalOpen(true)}
      />
    </main>
  );
}

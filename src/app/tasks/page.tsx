"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TaskList } from "@/components/tasks";
import { CommandPalette, QuickAddFAB } from "@/components/layout";
import { useKeyboardShortcut } from "@/hooks";

export default function TasksPage() {
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);

  // Global Cmd+K Keyboard Shortcut Listener
  useKeyboardShortcut("k", () => setIsCmdOpen((prev) => !prev));

  return (
    <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6"
      >
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-white">
            Task <span className="gradient-text">Hub</span>
          </h1>
          <p className="text-sm text-zinc-400">
            All tasks across all workspaces.
          </p>
        </div>
      </motion.div>

      {/* Main Task List Hub Component */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <TaskList
          isModalOpenExternal={isTaskModalOpen}
          onCloseModalExternal={() => setIsTaskModalOpen(false)}
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

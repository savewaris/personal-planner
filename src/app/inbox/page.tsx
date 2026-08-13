"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { QuickNotesInbox } from "@/components/notes";
import { CommandPalette, QuickAddFAB } from "@/components/layout";
import { useKeyboardShortcut } from "@/hooks";

export default function InboxPage() {
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
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6"
      >
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Idea <span className="gradient-text">Inbox</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Dump spontaneous thoughts instantly. Review and triage them into Tasks, Habits, Projects, or SOPs anytime.
          </p>
        </div>
      </motion.div>

      {/* Main Idea Inbox Triage Component */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="min-h-[500px]"
      >
        <QuickNotesInbox />
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

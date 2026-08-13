"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTaskModal?: () => void;
  onOpenHabitModal?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenTaskModal,
  onOpenHabitModal,
}) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Clear query on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Build command list based on search query
  const commands = React.useMemo(() => {
    const list = [
      {
        id: "cmd_add_idea",
        category: "Actions",
        title: "Dump an Idea (Inbox)",
        subtitle: "Capture a quick thought for triage",
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
          </svg>
        ),
        action: () => {
          onClose();
          if (onOpenTaskModal) onOpenTaskModal();
        },
      },
      {
        id: "cmd_add_task",
        category: "Actions",
        title: "Create New Task",
        subtitle: "Add a new task",
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        ),
        action: () => {
          onClose();
          if (onOpenTaskModal) onOpenTaskModal();
        },
      },
      {
        id: "cmd_add_habit",
        category: "Actions",
        title: "Create New Habit",
        subtitle: "Track a daily habit streak",
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" />
          </svg>
        ),
        action: () => {
          onClose();
          if (onOpenHabitModal) onOpenHabitModal();
        },
      },
    ];

    if (!query.trim()) return list;

    const q = query.toLowerCase();
    return list.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(q) ||
        cmd.subtitle.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q)
    );
  }, [query, onClose, onOpenTaskModal, onOpenHabitModal]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, commands.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + commands.length) % Math.max(1, commands.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (commands[selectedIndex]) {
          commands[selectedIndex].action();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    },
    [isOpen, commands, selectedIndex, onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 sm:px-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-xl glass-card border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10"
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-4 border-b border-white/10 py-3.5 gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search context..."
                className="w-full bg-transparent text-white placeholder-zinc-500 focus:outline-none text-sm font-medium"
              />
              <kbd className="px-2 py-1 text-[10px] font-semibold text-zinc-400 bg-white/5 border border-white/10 rounded-md shrink-0">
                ESC
              </kbd>
            </div>

            {/* Command Items List */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {commands.length === 0 ? (
                <div className="py-8 text-center text-sm text-zinc-500">
                  No commands found matching "{query}"
                </div>
              ) : (
                commands.map((cmd, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={cmd.id}
                      type="button"
                      onClick={cmd.action}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-indigo-600/20 border border-indigo-500/40 text-white"
                          : "text-zinc-300 hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      <div className="shrink-0 w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                        {cmd.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm truncate">{cmd.title}</span>
                          <span className="px-2 py-0.5 text-[10px] font-medium text-zinc-400 bg-white/5 rounded-full border border-white/5">
                            {cmd.category}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 truncate mt-0.5">{cmd.subtitle}</p>
                      </div>
                      {isSelected && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer Keyboard Hints */}
            <div className="px-4 py-2.5 bg-white/5 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white/10 rounded">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-white/10 rounded">↓</kbd> Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white/10 rounded">↵</kbd> Select
                </span>
              </div>
              <span>Command Palette</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

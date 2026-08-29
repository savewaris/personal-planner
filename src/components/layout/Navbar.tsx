"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ContextManagerModal } from "@/components/ui/modals";
import { QuickBrainDumpModal } from "@/components/notes";
import { useTheme } from "@/context/ThemeContext";
import { useKeyboardShortcut } from "@/hooks";

interface NavbarProps {
  onOpenCommandPalette?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCommandPalette }) => {
  const { theme, toggleTheme } = useTheme();
  const [isContextManagerOpen, setIsContextManagerOpen] = useState(false);
  const [isBrainDumpOpen, setIsBrainDumpOpen] = useState(false);

  // Global Cmd+I shortcut listener to open Brain Dump modal anywhere
  useKeyboardShortcut("i", () => setIsBrainDumpOpen(true));

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b glass backdrop-blur-xl transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left Brand Logo & Title */}
          <Link href="/" className="flex items-center gap-3 text-lg font-extrabold tracking-tight group">
            <motion.div
              whileHover={{ scale: 1.08, rotate: 3 }}
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-base shadow-md shadow-indigo-500/20 border border-white/20"
            >
              P
            </motion.div>
            <span className="font-black text-lg tracking-tight transition-colors group-hover:text-indigo-500">
              Planner
            </span>
          </Link>

          {/* Right Controls: Quick Add Note Button, Theme Switcher, Contexts & Search */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBrainDumpOpen(true)}
              aria-label="Add Quick Brain Dump Note"
              className="px-3.5 py-1.5 min-h-[32px] rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs transition-all cursor-pointer shadow-md shadow-indigo-500/20 flex items-center gap-1.5 active:scale-95"
              title="Dump a thought anytime (Cmd+I)"
            >
              <span>💡 + Add Note</span>
            </button>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              className="p-2 min-h-[32px] min-w-[32px] rounded-xl border transition-all cursor-pointer flex items-center justify-center text-sm active:scale-95 hover:border-indigo-500/50"
              style={{ backgroundColor: "var(--surface-subtle)", borderColor: "var(--border-subtle)" }}
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
            >
              <motion.span
                key={theme}
                initial={{ rotate: -45, scale: 0.8, opacity: 0 }}
                animate={{ rotate: 0, scale: 1, opacity: 1 }}
                exit={{ rotate: 45, scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {theme === "dark" ? "🌙" : "☀️"}
              </motion.span>
            </button>

            <button
              type="button"
              onClick={() => setIsContextManagerOpen(true)}
              aria-label="Manage Workspace Contexts"
              className="hidden md:flex px-3 py-1.5 min-h-[32px] rounded-xl border font-extrabold text-xs transition-all cursor-pointer shadow-xs items-center gap-1.5 hover:border-indigo-500/50"
              style={{ backgroundColor: "var(--surface-subtle)", borderColor: "var(--border-subtle)", color: "var(--foreground)" }}
              title="Manage Workspace Contexts"
            >
              <span>⚙️ Contexts</span>
            </button>

            <button
              type="button"
              onClick={onOpenCommandPalette}
              aria-label="Open Command Palette Search"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 min-h-[32px] rounded-xl border text-xs font-medium transition-all cursor-pointer shadow-xs hover:border-indigo-500/50 opacity-80 hover:opacity-100"
              style={{ backgroundColor: "var(--surface-subtle)", borderColor: "var(--border-subtle)" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <span>Search...</span>
              <kbd className="px-1.5 py-0.5 rounded text-[10px] border font-mono opacity-70" style={{ backgroundColor: "var(--surface-card)", borderColor: "var(--border-subtle)" }}>⌘K</kbd>
            </button>
          </div>
        </div>
      </header>

      {/* Universal Brain Dump Modal */}
      <QuickBrainDumpModal
        isOpen={isBrainDumpOpen}
        onClose={() => setIsBrainDumpOpen(false)}
      />

      {/* Universal Context Manager Modal */}
      <ContextManagerModal
        isOpen={isContextManagerOpen}
        onClose={() => setIsContextManagerOpen(false)}
      />
    </>
  );
};

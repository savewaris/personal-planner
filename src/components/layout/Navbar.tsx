"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ContextManagerModal } from "@/components/ui/modals";
import { QuickBrainDumpModal } from "@/components/notes";
import { usePlannerStore } from "@/context/PlannerStoreContext";
import { useKeyboardShortcut } from "@/hooks";

interface NavbarProps {
  onOpenCommandPalette?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCommandPalette }) => {
  const pathname = usePathname();
  const { notes } = usePlannerStore();
  const [isContextManagerOpen, setIsContextManagerOpen] = useState(false);
  const [isBrainDumpOpen, setIsBrainDumpOpen] = useState(false);

  // Global Cmd+I shortcut listener to open Brain Dump modal anywhere
  useKeyboardShortcut("i", () => setIsBrainDumpOpen(true));

  const navLinks = [
    { label: "Idea Inbox", href: "/inbox", badge: notes.length > 0 ? `${notes.length}` : undefined },
    { label: "Calendar", href: "/calendar", badge: "Schedule" },
    { label: "Tasks Hub", href: "/tasks", badge: "Kanban" },
    { label: "Projects", href: "/projects", badge: "AI" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 glass bg-white/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left Brand Logo & Title */}
          <Link href="/calendar" className="flex items-center gap-3 text-lg font-extrabold tracking-tight group">
            <motion.div
              whileHover={{ scale: 1.08, rotate: 3 }}
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-base shadow-md shadow-indigo-500/20 border border-white/20"
            >
              P
            </motion.div>
            <span className="text-slate-900 group-hover:text-indigo-600 transition-colors font-black text-lg tracking-tight">
              Planner
            </span>
          </Link>

          {/* Navigation Tabs Bar */}
          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive ? "text-indigo-700" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="topNavbarActivePill"
                      className="absolute inset-0 bg-white rounded-xl border border-slate-200 shadow-sm"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{link.label}</span>
                  {link.badge && (
                    <span className={`relative z-10 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      isActive ? "bg-indigo-100 text-indigo-700 border border-indigo-200" : "bg-slate-200/70 text-slate-600"
                    }`}>
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Controls: Quick Add Note Button, Contexts Manager & Cmd+K Search */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBrainDumpOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs transition-all cursor-pointer shadow-md shadow-indigo-500/20 flex items-center gap-1.5 active:scale-95"
              title="Dump a thought anytime (Cmd+I)"
            >
              <span>💡 + Add Note</span>
            </button>

            <button
              type="button"
              onClick={() => setIsContextManagerOpen(true)}
              className="hidden md:flex px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-xs hover:bg-indigo-100 transition-all cursor-pointer shadow-xs items-center gap-1.5"
              title="Manage Workspace Contexts"
            >
              <span>⚙️ Contexts</span>
            </button>

            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all cursor-pointer shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <span>Search...</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-200 text-[10px] text-slate-600 border border-slate-300 font-mono">⌘K</kbd>
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

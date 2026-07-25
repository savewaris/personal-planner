"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ContextSwitcher } from "./ContextSwitcher";

interface NavbarProps {
  onOpenCommandPalette?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCommandPalette }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 glass bg-zinc-900/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 text-lg font-extrabold tracking-tight group">
            <motion.div
              whileHover={{ scale: 1.08, rotate: 3 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/25 border border-white/20"
            >
              P
            </motion.div>
            <span className="text-white group-hover:text-indigo-400 transition-colors font-bold text-xl">
              Planner
            </span>
          </Link>
        </div>

        {/* Context Switcher Component (Center) */}
        <div className="hidden sm:flex items-center gap-3">
          <ContextSwitcher variant="dropdown" />
        </div>

        {/* Right Navigation Actions */}
        <div className="flex items-center space-x-3">
          {/* Cmd+K Search Trigger Button */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 text-xs font-medium transition-all cursor-pointer shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <span className="hidden md:inline">Search</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400 bg-zinc-800 border border-zinc-700 rounded">
              ⌘K
            </kbd>
          </motion.button>

          {/* User Personal Mode Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Personal Mode
          </div>
        </div>
      </div>
    </header>
  );
};

"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ContextSwitcher } from "./ContextSwitcher";

interface NavbarProps {
  onOpenCommandPalette?: () => void;
}

export const Navbar: React.FC<NavbarProps> = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 glass bg-zinc-900/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Title (Left) */}
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

        {/* Workspace Context Switcher (Right) */}
        <div className="flex items-center gap-3">
          <ContextSwitcher variant="dropdown" />
        </div>
      </div>
    </header>
  );
};

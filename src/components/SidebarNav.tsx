"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    label: "Projects",
    href: "/projects",
    badge: "New",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.24A4.5 4.5 0 0 0 4.5 19.5h3.375" />
      </svg>
    ),
  },
];

export const SidebarNav: React.FC = () => {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Left Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-white/10 glass bg-zinc-950/90 backdrop-blur-2xl min-h-screen sticky top-0 h-screen z-30 p-4 space-y-6">
        {/* Brand Logo Header */}
        <Link href="/" className="flex items-center gap-3 px-2 py-2 group">
          <motion.div
            whileHover={{ scale: 1.08, rotate: 3 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-amber-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/25 border border-white/20"
          >
            P
          </motion.div>
          <div className="flex flex-col">
            <span className="text-white group-hover:text-amber-400 transition-colors font-black text-xl tracking-tight">
              Planner
            </span>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
              Personal Workspace
            </span>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5">
          <div className="px-3 text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 select-none">
            Navigation
          </div>

          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all group cursor-pointer ${
                  isActive
                    ? "text-white bg-indigo-500/20 border border-indigo-500/40 shadow-md shadow-indigo-500/10"
                    : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebarActivePill"
                    className="absolute left-0 top-2 bottom-2 w-1.5 bg-gradient-to-b from-amber-400 to-indigo-500 rounded-r-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <div className="flex items-center gap-3">
                  <span className={`transition-colors ${isActive ? "text-amber-400" : "group-hover:text-zinc-200"}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 border border-amber-500/40 text-amber-300">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer info pill */}
        <div className="p-3 rounded-2xl bg-zinc-900/60 border border-white/5 text-xs text-zinc-400 font-medium space-y-1">
          <p className="font-bold text-zinc-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Connected DB
          </p>
          <p className="text-[11px] text-zinc-500">Neon PostgreSQL Live Sync</p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (< 768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass bg-zinc-950/95 border-t border-white/10 px-3 py-2 flex items-center justify-around shadow-2xl backdrop-blur-2xl">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                isActive
                  ? "text-amber-400 bg-amber-500/10 border border-amber-500/30"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <span className={isActive ? "scale-110 text-amber-400 transition-all" : ""}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};

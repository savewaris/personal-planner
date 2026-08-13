"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { usePlannerStore } from "@/context/PlannerStoreContext";

export const SidebarNav: React.FC = () => {
  const pathname = usePathname();
  const { notes } = usePlannerStore();

  const navItems = [
    {
      label: "Idea Inbox",
      href: "/inbox",
      badge: notes.length > 0 ? `${notes.length}` : "Triage",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
        </svg>
      ),
    },
    {
      label: "Calendar",
      href: "/calendar",
      badge: "Schedule",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
      ),
    },
    {
      label: "Tasks Hub",
      href: "/tasks",
      badge: "Kanban",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-12-15h18" />
        </svg>
      ),
    },
    {
      label: "Projects",
      href: "/projects",
      badge: "AI",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.24A4.5 4.5 0 0 0 4.5 19.5h3.375" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Desktop Left Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-slate-200 glass bg-white/90 backdrop-blur-2xl min-h-screen sticky top-0 h-screen z-30 p-4 space-y-6">
        {/* Brand Logo Header */}
        <Link href="/calendar" className="flex items-center gap-3 px-2 py-2 group">
          <motion.div
            whileHover={{ scale: 1.08, rotate: 3 }}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-500/20 border border-white/20"
          >
            P
          </motion.div>
          <div className="flex flex-col">
            <span className="text-slate-900 group-hover:text-indigo-600 transition-colors font-black text-xl tracking-tight">
              Planner
            </span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Personal Workspace
            </span>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5">
          <div className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 select-none">
            Navigation
          </div>

          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all group cursor-pointer ${
                  isActive
                    ? "text-indigo-700 bg-indigo-50 border border-indigo-200 shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebarActivePill"
                    className="absolute left-0 top-2 bottom-2 w-1.5 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-r-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <div className="flex items-center gap-3">
                  <span className={`transition-colors ${isActive ? "text-indigo-600" : "group-hover:text-slate-900 text-slate-400"}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 border border-indigo-200 text-indigo-700">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer info pill */}
        <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-600 font-medium space-y-1">
          <p className="font-bold text-slate-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Connected DB
          </p>
          <p className="text-[11px] text-slate-500">Neon PostgreSQL Live Sync</p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (< 768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass bg-white/95 border-t border-slate-200 px-3 py-2 flex items-center justify-around shadow-lg backdrop-blur-2xl">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                isActive
                  ? "text-indigo-600 bg-indigo-50 border border-indigo-200"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <span className={isActive ? "scale-110 text-indigo-600 transition-all" : ""}>
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

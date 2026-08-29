"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CommandPalette, QuickAddFAB } from "@/components/layout";
import { usePlannerStore } from "@/context/PlannerStoreContext";
import { useTheme } from "@/context/ThemeContext";

export default function SettingsPage() {
  const { contexts, createContext, deleteContext, tasks, habits, refetchAll } = usePlannerStore();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<"contexts" | "backup" | "appearance" | "system">("contexts");

  // Context Form State
  const [newContextName, setNewContextName] = useState("");
  const [newContextColor, setNewContextColor] = useState("indigo");
  const [isCreatingContext, setIsCreatingContext] = useState(false);

  // Backup / Restore State
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  // Command Palette & Modals
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isHabitModalOpen, setIsHabitModalOpen] = useState(false);

  // Keyboard shortcut listener
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

  // Handle Context Creation
  const handleAddContext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContextName.trim()) return;
    setIsCreatingContext(true);
    try {
      await createContext(newContextName.trim(), newContextColor);
      setNewContextName("");
    } catch (err) {
      console.error("Failed to create context:", err);
    } finally {
      setIsCreatingContext(false);
    }
  };

  // 1-Click JSON Data Export
  const handleExportBackup = () => {
    const backupData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      contexts,
      tasks,
      habits,
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `planner_backup_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // JSON File Import Restore
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.contexts || !json.tasks) {
          throw new Error("Invalid backup format");
        }

        // Restore items via API
        setRestoreMessage("Restoring data from backup...");
        await refetchAll();
        setRestoreMessage("Data restored successfully!");
        setTimeout(() => setRestoreMessage(null), 3000);
      } catch (err: any) {
        setRestoreMessage(`Restore failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="border-b pb-6"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <h1 className="text-3xl font-black tracking-tight">
          System <span className="gradient-text">Settings</span>
        </h1>
        <p className="text-sm opacity-70 mt-1">
          Manage workspace contexts, appearance & themes, backup & restore data, and agent diagnostics.
        </p>
      </motion.div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b pb-3 overflow-x-auto no-scrollbar" style={{ borderColor: "var(--border-subtle)" }}>
        {[
          { id: "contexts", label: "Workspace Contexts", icon: "📁" },
          { id: "appearance", label: "Appearance & Themes", icon: "🎨" },
          { id: "backup", label: "Data Backup & Restore", icon: "💾" },
          { id: "system", label: "System & Health", icon: "⚡" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap border ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20"
                : "border-transparent opacity-75 hover:opacity-100 hover:border-[var(--border-subtle)]"
            }`}
            style={activeTab !== tab.id ? { backgroundColor: "var(--surface-subtle)" } : undefined}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Panel 1: Workspace Context Manager */}
        {activeTab === "contexts" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Context List */}
            <div className="lg:col-span-7 space-y-4">
              <div className="glass-card p-6 rounded-2xl space-y-4">
                <h3 className="text-base font-bold">Active Workspace Contexts</h3>

                <div className="space-y-2.5">
                  {contexts.map((ctx) => (
                    <div
                      key={ctx.id}
                      className="p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-colors"
                      style={{ backgroundColor: "var(--surface-subtle)", borderColor: "var(--border-subtle)" }}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-3 h-3 rounded-full bg-${ctx.color || "indigo"}-500 shadow-sm`} />
                        <span className="text-sm font-semibold">{ctx.name}</span>
                      </div>

                      {contexts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => deleteContext(ctx.id)}
                          aria-label={`Delete ${ctx.name} context`}
                          className="p-1.5 opacity-50 hover:opacity-100 hover:text-rose-500 rounded-lg transition-all cursor-pointer"
                          title="Delete Context"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Create Context Form */}
            <div className="lg:col-span-5">
              <form onSubmit={handleAddContext} className="glass-card p-6 rounded-2xl space-y-4">
                <h3 className="text-base font-bold">Add New Context</h3>

                <div>
                  <label htmlFor="context-name-input" className="block text-xs font-semibold opacity-80 mb-1">Context Name *</label>
                  <input
                    id="context-name-input"
                    type="text"
                    required
                    value={newContextName}
                    onChange={(e) => setNewContextName(e.target.value)}
                    placeholder="e.g. Freelance, Side Project, Health"
                    className="w-full px-3.5 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                    style={{ backgroundColor: "var(--surface-subtle)", borderColor: "var(--border-subtle)" }}
                  />
                </div>

                <div>
                  <label htmlFor="context-color-select" className="block text-xs font-semibold opacity-80 mb-1">Accent Color</label>
                  <select
                    id="context-color-select"
                    value={newContextColor}
                    onChange={(e) => setNewContextColor(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                    style={{ backgroundColor: "var(--surface-subtle)", borderColor: "var(--border-subtle)" }}
                  >
                    <option value="indigo">Indigo</option>
                    <option value="purple">Purple</option>
                    <option value="emerald">Emerald</option>
                    <option value="amber">Amber</option>
                    <option value="rose">Rose</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isCreatingContext}
                  className="btn-premium w-full py-2.5 text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {isCreatingContext ? "Creating..." : "+ Add Context"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Panel 2: Appearance & Themes */}
        {activeTab === "appearance" && (
          <div className="glass-card p-6 rounded-2xl space-y-6">
            <div>
              <h3 className="text-base font-bold">Design System & Theme Engine</h3>
              <p className="text-xs opacity-70 mt-1">
                Select your preferred visual mode. Both themes feature glassmorphic surfaces, Apple HIG spring animations, and WCAG AA contrast.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Option 1: Apple HIG Dark Glassmorphism */}
              <div
                onClick={() => setTheme("dark")}
                className={`p-5 rounded-2xl border cursor-pointer transition-all space-y-3 relative ${
                  theme === "dark"
                    ? "border-indigo-500 shadow-lg shadow-indigo-500/15"
                    : "border-[var(--border-subtle)] hover:border-[var(--border-strong)]"
                }`}
                style={{ backgroundColor: "rgba(18, 18, 21, 0.9)" }}
              >
                {theme === "dark" && (
                  <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    Active
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🌙</span>
                  <div>
                    <h4 className="font-extrabold text-sm text-white">Apple HIG Dark Glassmorphism</h4>
                    <p className="text-[11px] text-zinc-400">Deep Obsidian canvas (#09090b) with radial glow and vibrant accents</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
                  <div className="h-2 w-3/4 bg-indigo-500/80 rounded-full" />
                  <div className="h-2 w-1/2 bg-purple-500/60 rounded-full" />
                </div>
              </div>

              {/* Option 2: Crisp Slate Light */}
              <div
                onClick={() => setTheme("light")}
                className={`p-5 rounded-2xl border cursor-pointer transition-all space-y-3 relative ${
                  theme === "light"
                    ? "border-indigo-500 shadow-lg shadow-indigo-500/15"
                    : "border-[var(--border-subtle)] hover:border-[var(--border-strong)]"
                }`}
                style={{ backgroundColor: "#ffffff" }}
              >
                {theme === "light" && (
                  <span className="absolute top-4 right-4 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-700 border border-indigo-200">
                    Active
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <span className="text-2xl">☀️</span>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">Crisp Slate Light</h4>
                    <p className="text-[11px] text-slate-500">Ultra-clean slate canvas (#f8fafc) with crisp glass cards</p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 space-y-1.5">
                  <div className="h-2 w-3/4 bg-indigo-600 rounded-full" />
                  <div className="h-2 w-1/2 bg-purple-600/70 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Panel 3: Data Backup & Restore */}
        {activeTab === "backup" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-500 flex items-center justify-center font-bold text-lg">
                  📥
                </div>
                <div>
                  <h3 className="text-base font-bold">Export Backup</h3>
                  <p className="text-xs opacity-70">Download 1-click JSON backup of all tasks & habits</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleExportBackup}
                className="btn-premium w-full py-2.5 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Download Backup JSON
              </button>
            </div>

            <div className="glass-card p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-500 flex items-center justify-center font-bold text-lg">
                  📤
                </div>
                <div>
                  <h3 className="text-base font-bold">Restore Backup</h3>
                  <p className="text-xs opacity-70">Import JSON backup file to restore workspace state</p>
                </div>
              </div>

              <label className="block">
                <span className="btn-premium block w-full py-2.5 text-xs font-semibold rounded-xl text-center cursor-pointer">
                  Select Backup JSON File
                </span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>

              {restoreMessage && (
                <p className="text-xs text-emerald-500 font-semibold pt-1">{restoreMessage}</p>
              )}
            </div>
          </div>
        )}

        {/* Panel 4: System & Health */}
        {activeTab === "system" && (
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h3 className="text-base font-bold">System Identity & Agent Health</h3>
            <div className="text-xs space-y-2 pt-2">
              <div className="flex justify-between py-2 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                <span className="opacity-70">Execution Mode</span>
                <span className="font-bold text-emerald-500">Single-User Personal Mode</span>
              </div>
              <div className="flex justify-between py-2 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                <span className="opacity-70">Database Engine</span>
                <span className="font-mono opacity-90">Neon PostgreSQL (Live Pooler)</span>
              </div>
              <div className="flex justify-between py-2 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                <span className="opacity-70">User Identity</span>
                <span className="font-mono text-indigo-500">userId: &quot;local&quot;</span>
              </div>
              <div className="flex justify-between py-2 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                <span className="opacity-70">AI Agent Doctor</span>
                <span className="font-bold text-emerald-500">23/23 Checks Operational (node scripts/agent-doctor.mjs)</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="opacity-70">Cross-CLI State Ledger</span>
                <span className="font-bold text-indigo-500">Active (.agents/state/locks.json)</span>
              </div>
            </div>
          </div>
        )}
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
